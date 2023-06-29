const {
    Client,
    TopicCreateTransaction,
    TopicUpdateTransaction,
    TopicMessageSubmitTransaction,
    TopicInfoQuery,
    PrivateKey,
    Hbar
} = require("@hashgraph/sdk");
require('dotenv').config();

async function main() {
    // Set up the client
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    if (!myAccountId || !myPrivateKey) {
        throw new Error("Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present");
    }

    const client = Client.forTestnet()
    client.setOperator(myAccountId, myPrivateKey);

    //Create keys
    const adminKey = PrivateKey.generate();
    const submitKey = PrivateKey.generate();
    
    // Create a new topic
    let transaction = await new TopicCreateTransaction()
    .setAdminKey(adminKey)
    .setSubmitKey(submitKey)
    .setTopicMemo("Hello World")
    .freezeWith(client);
    
    //sign & execute
    const sign1 = await transaction.sign(adminKey);
    const sign2= await sign1.sign(submitKey);
    const txId = await sign2.execute(client);

    const receipt = await txId.getReceipt(client);
    const topicId = receipt.topicId;
    console.log(topicId);

     // Query the topic info 
     const topicInfo = await new TopicInfoQuery()
     .setTopicId(topicId)
     .execute(client);
     
     console.log("Topic Memo:", topicInfo.topicMemo);


    // Update the topic memo
    let updateTransaction= await new TopicUpdateTransaction()
        .setTopicId(topicId)
        .setTopicMemo("Bonjour Monde")
        .freezeWith(client);
    
    //sign & execute
    const sign3 = await updateTransaction.sign(adminKey);
    const sign4= await sign3.sign(submitKey);
    const txId1 = await sign4.execute(client);

    // Query the topic info 2
    const topicInfo2 = await new TopicInfoQuery()
        .setTopicId(topicId)
        .execute(client);

    console.log("Updated Topic Info:");
    console.log("Topic Memo:", topicInfo2.topicMemo);

    // Submit a message to the topic
    const messageTransactionId = await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage("Hello, Fam!")
        .execute(client);

    console.log("Message transaction ID:", messageTransactionId);
    console.log("Message published:", "Hello, Hedera!");
}

main().catch((err) => {
    console.error(err);
});
