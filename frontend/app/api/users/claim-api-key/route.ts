import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createUser } from '@/app/api/server/create-user';


export async function POST(req: NextRequest) {
  try {
    // Parsing JSON body in Edge Middleware
    const body = await req.json();
    const { email, name, description, acceptToS } = body;

    if (!acceptToS) {
      return new NextResponse(JSON.stringify({ message: 'You have to accept the ToS to use this service' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }


    // create user on litellm backend
    let randomEmail = undefined;
    if (email === '') {
      randomEmail = `${randomBytes(8).toString('hex')}@example.com`;
    }

    const newLLMUser = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify({
        "key_alias": email !== '' ? email : randomEmail,
        "user_email": email !== '' ? email : randomEmail,
        "user_role": process.env.LITELLM_USER_ROLE,
        "max_parallel_requests": process.env.LITELLM_MAX_PARALLEL_REQUESTS,
        "team_id": process.env.LITELLM_TEAM_ID,
        "teams": [
          process.env.LITELLM_TEAM_ID
        ],
        "auto_create_key": true
      })
    }).then((res) => res.json())

    await createUser(email !== '' ? email : randomEmail, newLLMUser.user_id, name !== '' ? name : 'No name provided', description !== '' ? description : 'No description provided');

    return new NextResponse(JSON.stringify({ apikey: newLLMUser.key }), {
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