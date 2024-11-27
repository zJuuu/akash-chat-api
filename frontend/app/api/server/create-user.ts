import clientPromise from "./db";

export const createUser = async (email: string, llmuserid: string, name: string, description: string) => {
    try {

        // Connect to the database using the clientPromise
        const client = await clientPromise;
        const db = client.db("chatapi");

        // Create the user
        const newUser = await db.collection("users").insertOne({
            email,
            llmuserid,
            name,
            description
        });


        return newUser;
    } catch (error) {
        console.error(error);
        return null;
    }
};