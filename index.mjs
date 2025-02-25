import { GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Readable } from "stream";

// Initialize AWS Clients
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));

        const method = event.requestContext.http.method;

        // Handle CORS Preflight Request
        if (method === "OPTIONS") {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                body: "",
            };
        }

        if (method === "POST") {
            const { date, usage } = JSON.parse(event.body);

            const params = {
                TableName: "energy_usage",
                Item: { 
                    // Hard coded for now
                    userId: `jesse-random-uuid-1234`,
                    date,
                    usage
                }
            };

            await docClient.send(new PutCommand(params));

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" }, // ✅ Enable CORS
                body: JSON.stringify({ message: "Item inserted successfully!" }),
            };
        } 
        
        if (method === "GET") {
            const { userId, startDate, endDate } = event.queryStringParameters;

            // if (!userId) {
            //     return {
            //         statusCode: 400,
            //         headers: { "Access-Control-Allow-Origin": "*" }, // ✅ Enable CORS
            //         body: JSON.stringify({ message: "Missing userId" }),
            //     };
            // }

            const queryParams = {
                TableName: "energy_usage",
                KeyConditionExpression: "userId = :user_id AND #date BETWEEN :start_date AND :end_date",
                ExpressionAttributeNames: { "#date": "date" },
                ExpressionAttributeValues: {
                    // Hard coded for now
                    ":user_id": 'jesse-random-uuid-1234',
                    ":start_date": startDate,
                    ":end_date": endDate
                }
            };

            const data = await docClient.send(new QueryCommand(queryParams));

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" }, // ✅ Enable CORS
                body: JSON.stringify(data.Items),
            };
        } 
        
        return {
            statusCode: 405,
            headers: { "Access-Control-Allow-Origin": "*" }, // ✅ Enable CORS
            body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" }, // ✅ Enable CORS
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};