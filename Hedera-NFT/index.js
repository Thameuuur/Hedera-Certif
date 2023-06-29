require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TransferTransaction,
    AccountBalanceQuery,
    TokenAssociateTransaction,
    AccountCreateTransaction,
    CustomRoyaltyFee,
    CustomFixedFee,
    TokenNftInfoQuery,
    NftId,
    TokenInfoQuery,
    TokenUpdateTransaction,
    TokenFeeScheduleUpdateTransaction,
} = require("@hashgraph/sdk");
require('dotenv').config();

async function main() {
    // Set up the client
    const myAccountId= AccountId.fromString(process.env.MY_ACCOUNT_ID);
    const myAccountKey =  PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
    const myAccountPubKey = process.env.MY_PUBLIC_KEY;


    if (!myAccountId || !myAccountKey) {
        throw new Error("Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present");
    }

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myAccountKey);


    //Create 2 new accounts
    const account1pvk = await PrivateKey.generateED25519();
    const account1pbk = account1pvk.publicKey;
    const account1T = await new AccountCreateTransaction()
        .setKey(account1pbk)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    const rec1= await account1T.getReceipt(client);
    const account1 = rec1.accountId;
    console.log('First account', account1);

    const account2pvk = await PrivateKey.generateED25519();
    const account2pbk = account2pvk.publicKey;
    const account2T = await new AccountCreateTransaction()
        .setKey(account2pbk)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    const rec2= await account2T.getReceipt(client);
    const account2 = rec2.accountId;
    console.log('Second account', account2);

    //Create an NFT collection

    const royaltyFee = new CustomRoyaltyFee()
    .setNumerator(1)
    .setDenominator(10)
    .setFeeCollectorAccountId(myAccountId);

    const customFee = [royaltyFee];

    const nftCreate = await new TokenCreateTransaction()
        .setTokenName("Bouba NFT Collection")
        .setTokenSymbol("BCollection")
        .setTreasuryAccountId(myAccountId)
        .setTokenType(TokenType.NonFungibleUnique)
        .setCustomFees(customFee)
        .setTokenMemo("This is Bouba collection.")
        .setSupplyType(TokenSupplyType.Finite)
	    .setMaxSupply(250)
        .setSupplyKey(myAccountKey)
        .setFeeScheduleKey(myAccountKey)
        .setMaxTransactionFee(100000)
        .freezeWith(client);

    const nftCreateTxSign = await nftCreate.sign(myAccountKey);
    const nftCreateSubmit = await nftCreateTxSign.execute(client);
    const nftCreateRx = await nftCreateSubmit.getReceipt(client);
    console.log("NFT Created")

    //Display NFT collection information
    const tokenInfo = await new TokenInfoQuery().setTokenId(nftCreateRx.tokenId).execute(client);
    console.log('NFT infos', tokenInfo);

    //Update the NFT collection memo
    const newMemo="New Bouba collection."
    const nftUpdate = await new TokenUpdateTransaction()
        .setTokenId(nftCreateRx.tokenId)
        .setTokenMemo(newMemo)
        .freezeWith(client);

    const nftUpdateTxSign = await nftUpdate.sign(myAccountKey);
    const nftUpdateSubmit = await nftUpdateTxSign.execute(client);
    const nftUpdateRx = await nftUpdateSubmit.getReceipt(client);
    console.log("NFT Updated")

    //Display updated NFT collection information
    const tokenInfo2 = await new TokenInfoQuery().setTokenId(nftCreateRx.tokenId).execute(client);
    console.log('NFT infos 2.0', tokenInfo2);

    //Mint a new NFT
    const metadataString = "Bouba NFT 1";
    const encoder = new TextEncoder();
    const metadataUint8Array = encoder.encode(metadataString);
    
    const nftMint = await new TokenMintTransaction()
        .setTokenId(nftCreateRx.tokenId)
        .setMetadata([metadataUint8Array]) // Pass the Uint8Array instead of a string
        .freezeWith(client);
    
    const nftMintTxSign = await nftMint.sign(myAccountKey);
    const nftMintSubmit = await nftMintTxSign.execute(client);
    const nftMintRx = await nftMintSubmit.getReceipt(client);
    console.log("NFT 1 Minted")
    //Associate account 1 with the NFT
    const nftAssociate = await new TokenAssociateTransaction()
        .setAccountId(account1)
        .setTokenIds([nftCreateRx.tokenId])
        .freezeWith(client);

    const nftAssociateTxSign = await nftAssociate.sign(account1pvk);
    const nftAssociateSubmit = await nftAssociateTxSign.execute(client);
    const nftAssociateRx = await nftAssociateSubmit.getReceipt(client);
    console.log("NFT 1 Associated")
    
    //Transfer the NFT
    const nftTransfer = await new TransferTransaction()
        .addNftTransfer(nftCreateRx.tokenId, 1 ,myAccountId, account1)
        .freezeWith(client);

    const nftTransferTxSign = await nftTransfer.sign(myAccountKey);
    const nftTransferSubmit = await nftTransferTxSign.execute(client);
    const nftTransferRx = await nftTransferSubmit.getReceipt(client);
    console.log("NFT 1 Transferred")

    //Display account balances
    const accountBalances1 = await new AccountBalanceQuery()
        .setAccountId(myAccountId)
        .execute(client);
    console.log('My account balance', accountBalances1.tokens.toString());

    const accountBalances2 = await new AccountBalanceQuery()
        .setAccountId(account1)
        .execute(client);
    console.log('Account 1 balance', accountBalances2.tokens.toString());

    const accountBalances3 = await new AccountBalanceQuery()
        .setAccountId(account2)
        .execute(client);
    console.log('Account 2 balance', accountBalances3.tokens.toString());
    //Modify custom fees
    const newRoyaltyFee = new CustomRoyaltyFee()
    .setNumerator(1)
    .setDenominator(5)
    .setFeeCollectorAccountId(myAccountId);

    const newCustomFee = [newRoyaltyFee];

    const nftUpdateFee = await new TokenFeeScheduleUpdateTransaction()
        .setTokenId(nftCreateRx.tokenId)
        .setCustomFees(newCustomFee)
        .freezeWith(client);

    const nftUpdateFeeTxSign = await nftUpdateFee.sign(myAccountKey);
    const nftUpdateFeeSubmit = await nftUpdateFeeTxSign.execute(client);
    const nftUpdateFeeRx = await nftUpdateFeeSubmit.getReceipt(client);
    console.log("NFT 1 Custom Fees Updated")
    
    //Mint a second NFT
    const metadata2String = "Bouba NFT 1";
    const metadataUint8Array2 = encoder.encode(metadata2String);
    
    const nft2Mint = await new TokenMintTransaction()
        .setTokenId(nftCreateRx.tokenId)
        .setMetadata([metadataUint8Array2]) // Pass the Uint8Array instead of a string
        .freezeWith(client);
    
    const nft2MintTxSign = await nft2Mint.sign(myAccountKey);
    const nft2MintSubmit = await nft2MintTxSign.execute(client);
    const nft2MintRx = await nft2MintSubmit.getReceipt(client);
    console.log("NFT 2 Minted");

    //Associate account 2 with the NFT
    const nft2Associate = await new TokenAssociateTransaction()
        .setAccountId(account2)
        .setTokenIds([nftCreateRx.tokenId])
        .freezeWith(client);

    const nft2AssociateTxSign = await nft2Associate.sign(account2pvk);
    const nft2AssociateSubmit = await nft2AssociateTxSign.execute(client);
    const nft2AssociateRx = await nft2AssociateSubmit.getReceipt(client);
    console.log("NFT 2 Associated");

    //Transfer the second NFT
    const nft2Transfer = await new TransferTransaction()
        .addNftTransfer(nftCreateRx.tokenId, 2 ,myAccountId, account2)
        .freezeWith(client);

    const nft2TransferTxSign = await nft2Transfer.sign(myAccountKey);
    const nft2TransferSubmit = await nft2TransferTxSign.execute(client);
    const nft2TransferRx = await nft2TransferSubmit.getReceipt(client);
    console.log("NFT 2 Transferred");

    //Display updated account balances
    const accountBalances4 = await new AccountBalanceQuery()
        .setAccountId(myAccountId)
        .execute(client);
    console.log('My account balance', accountBalances4.tokens.toString());

    const accountBalances5 = await new AccountBalanceQuery()
        .setAccountId(account1)
        .execute(client);
    console.log('Account 1 balance', accountBalances5.tokens.toString());

    const accountBalances6 = await new AccountBalanceQuery()
        .setAccountId(account2)
        .execute(client);
    console.log('Account 2 balance', accountBalances6.tokens.toString());


}

main().catch((err) => {
    console.error(err);
});
