import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { ory } from '@/lib/ory';

export async function POST(req: NextRequest) {
  try {
    // Check if the user is authenticated
    let isAuthenticated = false;
    let userEmail = '';
    let userName = '';
    let userId = '';
    let sessionId = '';
    let newsletterConsentOry = false;
    try {
      // Get session data
      const sessionResponse = await ory.toSession({
        // @ts-ignore - the types are not correctly exported
        headers: Object.fromEntries(req.headers.entries()),
        cookie: req.headers.get('cookie') || '',
      });
      
      isAuthenticated = true;
      userEmail = sessionResponse.data.identity?.traits.email || '';
      userName = sessionResponse.data.identity?.traits.name || '';
      userId = sessionResponse.data.identity?.id || '';
      sessionId = sessionResponse.data.id;
      newsletterConsentOry = sessionResponse.data.identity?.traits.newsletter || false;
    } catch (error) {
      // User is not authenticated
      return new NextResponse(JSON.stringify({ message: 'Authentication required to generate an API key' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Parsing JSON body in Edge Middleware
    const body = await req.json();
    const { description, acceptToS, newsletter } = body;

    if (!acceptToS) {
      return new NextResponse(JSON.stringify({ message: 'You have to accept the ToS to use this service' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!userEmail) {
      return new NextResponse(JSON.stringify({ message: 'You have to be logged in to use this service' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // If email consent flag is present and user is authenticated, update their traits
    console.log(newsletter, userId);
    if (newsletter !== undefined && userId && newsletter !== newsletterConsentOry) {
      try {
        // Get the current identity
        const identityResponse = await fetch(`${process.env.NEXT_PUBLIC_ORY_SDK_URL}/admin/identities/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.ORY_ADMIN_API_KEY}`
          }
        });
        
        if (identityResponse.ok) {
          const identity = await identityResponse.json();
          
          console.log('Original identity structure:', JSON.stringify(identity));
          
          // Create a minimal update payload with only the required fields
          // We only include schema_id and traits according to Ory docs
          const updatePayload = {
            schema_id: identity.schema_id,
            state: identity.state,
            traits: {
              ...identity.traits,
              newsletter: newsletter
            }
          };
          
          console.log('Update payload:', JSON.stringify(updatePayload));
          
          // Update the identity with the new traits
          const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_ORY_SDK_URL}/admin/identities/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ORY_ADMIN_API_KEY}`
            },
            body: JSON.stringify(updatePayload)
          });
          
          if (!updateResponse.ok) {
            console.error('Failed to update newsletter trait:', await updateResponse.text());
          }
        } else {
          console.error('Failed to get identity:', await identityResponse.text());
        }
      } catch (error) {
        // Log the error but continue with API key generation
        console.error('Failed to update user traits:', error);
      }
    }

    // create user on litellm backend
    const newLLMUser = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify({
        "key_alias": userEmail,
        "user_email": userEmail + "---" + randomBytes(6).toString('hex'),
        "user_role": process.env.LITELLM_USER_ROLE,
        "max_parallel_requests": process.env.LITELLM_MAX_PARALLEL_REQUESTS,
        "team_id": process.env.LITELLM_TEAM_ID,
        "teams": [
          process.env.LITELLM_TEAM_ID
        ],
        "auto_create_key": true
      })
    }).then((res) => res.json())
    console.log(userId);
    
    console.log(newLLMUser);

    return new NextResponse(JSON.stringify({ apikey: newLLMUser.key, error: newLLMUser.error }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}