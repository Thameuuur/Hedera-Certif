require("dotenv").config();
const fs = require('fs');
const {
    AccountId,
    PrivateKey,
    Client,
    ContractCreateTransaction,
    ContractFunctionParams,
    ContractCallQuery,
    ContractExecuteTransaction,
    ContractCreateFlow,
    ContractFunctionParameters,
} = require("@hashgraph/sdk");

// Read the compiled contract bytecode and ABI
const contractData = fs.readFileSync("HelloHedera.json", "utf-8");
const { bytecode, abi } = JSON.parse(contractData);

async function main() {
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    if (!myAccountId || !myPrivateKey) {
        throw new Error("Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present");
    }

    const client = Client.forTestnet()
    client.setOperator(myAccountId, myPrivateKey);

    console.log("Deploy contract")
    const contractID = await deployContract(client);

    console.log("get Address")
    await callGetAddress(client, contractID.toString());

    console.log("set Address")
    await callSetAddress(client, contractID.toString(), "0x98e268680db0ff02dfa8131a4074893c464aaaaa");

    console.log("get updated Address")
    await callGetAddress(client, contractID.toString());
}

async function deployContract(client) {
    const contractCreate = new ContractCreateFlow()
        .setGas(100000)
        .setConstructorParameters(new ContractFunctionParameters().addAddress('0x98e268680db0ff02dfa8131a4074893c464aeacd'))
        .setBytecode(bytecode);

    const txResponse = await contractCreate.execute(client);
    const receipt = await (await txResponse).getReceipt(client);
    const newContractId = await receipt.contractId;

    console.log("The new contract ID is " + newContractId);
    return newContractId;
}

async function callSetAddress(client, contractId, newAddress) {
    const contractExecTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction("set_address", new ContractFunctionParameters().addAddress(newAddress));

    const submitExecTx = await contractExecTx.execute(client);
    const receipt = await submitExecTx.getReceipt(client);

    console.log("The transaction status is " + receipt.status.toString());
}

async function callGetAddress(client, contractId) {
    const getAddress = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(210000)
        .setFunction("get_address");

    const contractCallResult = await getAddress.execute(client);
    const address = contractCallResult.getAddress();

    console.log("Address:", address);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
