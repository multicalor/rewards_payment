const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

function createMsgHash(address, UUID, RewardReceipt) {
  index = [
    {
      type: "address",
    },
    {
      type: "bytes32",
    },
    {
      components: [
        {
          name: "recipient",
          type: "address",
        },
        {
          components: [
            {
              name: "tokenAddress",
              type: "address",
            },
            {
              name: "amount",
              type: "uint256",
            },
          ],
          name: "tokens",
          type: "tuple[]",
        },
        {
          name: "nftIds",
          type: "uint256[]",
        },
        {
          name: "roundId",
          type: "uint256",
        },
      ],
      type: "tuple",
    },
  ];
  let msgHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      index,

      [address, UUID, RewardReceipt]
    )
  );
  return msgHash;
}

function rewardTokensSum(rewards) {
  let amount = [];
  let tmpArrAddresses = [];
  rewards.forEach((elem) => {
    elem.tokens.forEach((token) => {
      tmpArrAddresses.push(token.tokenAddress);
    });
  });
  tmpArrAddresses = tmpArrAddresses.filter(
    (it, index) => index === tmpArrAddresses.indexOf((it = it.trim()))
  );
  // let Token = {tokenAddress: '', amount:ethers.utils.parseEther('0') }
  tmpArrAddresses.forEach((tokenAddress) => {
    let Token = {
      tokenAddress: tokenAddress,
      amount: ethers.utils.parseEther("0"),
    };
    // Token[tokenAddress] = tokenAddress
    rewards.forEach((elem) => {
      elem.tokens.forEach((token) => {
        if (Token.tokenAddress === token.tokenAddress) {
          Token.amount = Token.amount.add(token.amount);
        }
      });
    });
    amount.push(Token);
  });
  return amount;
}

async function signHashMsg(signer, msgHash) {
  let messageHashBytes = ethers.utils.arrayify(msgHash);
  let flatSig = await signer.signMessage(messageHashBytes);
  let sig = ethers.utils.splitSignature(flatSig);
  return sig;
}
// Главный скрипт генерирующий данных и их подпись
async function createRoundRewardList(
  accounts,
  tokens,
  roundId,
  signer,
  tokenId = 0
) {
  // let tokenId = 0
  let UUID = [];
  let msgHash = [];
  let recipients = [];
  let signature = [];
  let rewards = accounts.map((account, i) => {
    let tokensArg = [];
    let nftIds = [];
    recipients.push(account.address);
    for (let i = 0; i < 5; i++) {
      //

      tokensArg.push({
        tokenAddress: tokens[i].address,
        amount: ethers.utils.parseUnits("1", "mwei"),
      });

      nftIds.push(tokenId);
      tokenId++;
    }

    let _UUID = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(["address"], [account.address])
    );
    UUID.push(_UUID);

    return { recipient: account.address, tokens: tokensArg, nftIds, roundId };
  });
  for (let i = 0; i < rewards.length; i++) {
    let _msgHash = createMsgHash(rewards[i].recipient, UUID[i], rewards[i]);
    let sig = await signHashMsg(signer, _msgHash);
    msgHash.push(_msgHash);
    signature.push(sig);
  }

  let tokensSum = rewardTokensSum(rewards);
  return {
    UUID,
    recipients,
    rewards,
    msgHash,
    tokensSum,
    amountNft: tokenId,
    signature,
    lastNftId: tokenId,
  }; //signature,
}

// function rewardTokensSum(rewards){
//     let amount = []
//     let tmpArrAddresses = []
//     rewards.forEach((elem)=>{
//         elem.tokens.forEach((token)=>{
//             tmpArrAddresses.push(token.tokenAddress)
//         })
//     })
//     tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));
//     // let Token = {tokenAddress: '', amount:ethers.utils.parseEther('0') }
//     tmpArrAddresses.forEach((tokenAddress)=>{
//         let Token = {tokenAddress: tokenAddress, amount:ethers.utils.parseEther('0') }
//         // Token[tokenAddress] = tokenAddress
//         rewards.forEach((elem)=>{
//             elem.tokens.forEach((token)=>{
//                 if(Token.tokenAddress === token.tokenAddress){
//                     Token.amount = Token.amount.add(token.amount)
//                 }
//             })
//         })
//         amount.push(Token)
//     })
//     return amount
// }

describe("RewardsPayments", () => {
  let owner, acc1, acc2, acc3, acc4, acc5, acc6;
  let tokens = [];
  let tether, nft;
  let accounts;
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    acc1 = accounts[1];

    // NFT contract deploy
    const NFT = await ethers.getContractFactory("MyToken", owner);
    nft = await NFT.deploy();
    await nft.deployed();

    // Create a new RewardsPayments contract
    const Rewarder = await ethers.getContractFactory("Rewarder", owner);
    rewarder = await Rewarder.deploy(nft.address);
    await rewarder.deployed();

    rewarder.on("WithdrawReward", (reward) => {
        // console.log(reward);
    });

    // Create a new erc20 contract

    //TestTokens deploy
    const TestToken = await ethers.getContractFactory("TestToken", owner);
    for (let i = 0; i < 10; i++) {
      const tt = await TestToken.deploy();
      await tt.deployed();

      let rewardsPayments_balance = ethers.utils.parseEther("1000");
      tt.transfer(rewarder.address, rewardsPayments_balance);
      rewardsPayments_balance = await tt.balanceOf(rewarder.address);
      tokens[i] = tt;
    }

    const Tether = await ethers.getContractFactory("TetherToken", owner);
    tether = await Tether.deploy(
      (_initialSupply = "1000000000"),
      (_name = "Tether"),
      (_symbol = "USDT"),
      (_decimals = "6")
    );
    await tether.deployed();

    let rewardsPayments_balance = ethers.utils.parseUnits("100", "mwei");
    tether.transfer(rewarder.address, rewardsPayments_balance);
    rewardsPayments_balance = await tether.balanceOf(rewarder.address);
    tokens.push = tether;

    // Create NFTis

    for (let i = 0; i < 300; i++) {
      await nft.safeMint(rewarder.address);
    }
    const nft_balance = await nft.balanceOf(rewarder.address);
  });

  it("reward has created", async () => {
    let roundId = 0;

    let { recipients, msgHash, tokensSum, amountNft } =
      await createRoundRewardList(accounts, tokens, roundId, owner);
  });

  it("create and withdraw rewards", async () => {
    let roundId = 0;
    const {
      UUID,
      recipients,
      rewards,
      msgHash,
      tokensSum,
      amountNft,
      signature,
    } = await createRoundRewardList(accounts, tokens, roundId, owner);

    let txCrRew = await rewarder.createRewards(
      recipients,
      msgHash,
      tokensSum,
      amountNft
    );

    for (let i = 0; i < rewards.length; i++) {
      let txWdRw = await rewarder
        .connect(accounts[i])
        .getRewards(
          signature[i].v,
          signature[i].r,
          signature[i].s,
          UUID[i],
          rewards[i]
        );
    }
  });

  it("send rewards", async () => {
    let roundId = 0;
    const {
      UUID,
      recipients,
      rewards,
      msgHash,
      tokensSum,
      amountNft,
      signature,
    } = await createRoundRewardList(accounts, tokens, roundId, owner);

    let txCrRew = await rewarder.createRewards(
      recipients,
      msgHash,
      tokensSum,
      amountNft
    );
    for (let i = 0; i < rewards.length; i++) {
      let txWdRw = await rewarder
        .connect(accounts[i])
        .getRewards(
          signature[i].v,
          signature[i].r,
          signature[i].s,
          UUID[i],
          rewards[i]
        );
    }
  });

  it("create rounds", async () => {
    let roundId = 3;
    let roundAtrs = [];
    let lastNftId = 0;
    for (let i = 0; i < roundId; i++) {
      let roundAtr = await createRoundRewardList(
        accounts,
        tokens,
        i,
        owner,
        i == 0 ? 0 : lastNftId
      );
      let { recipients, msgHash, tokensSum, amountNft, rewards } = roundAtr;
      lastNftId = roundAtr.lastNftId;
      let txCrRew = await rewarder.createRewards(
        recipients,
        msgHash,
        tokensSum,
        amountNft
      );
      roundAtrs.push(roundAtr);
    }
    for (let i = 0; i < roundAtrs.length; i++) {
      let { rewards, signature, UUID } = roundAtrs[i];

      for (let i = 0; i < rewards.length; i++) {
        let txWdRw = await rewarder
          .connect(accounts[i])
          .getRewards(
            signature[i].v,
            signature[i].r,
            signature[i].s,
            UUID[i],
            rewards[i]
          );
      }
    }
    for(let j = 0; j < accounts.length; j++) {
        for(let i = 0; i < 5; i++) {
            let res = await tokens[i].balanceOf(accounts[j].address)
            console.log({"account": accounts[j].address, "token": tokens[i].address, "amount": res.toString()})
        }
    }
  });

  it(" paused rewards", async () => {
    let roundId = 0;
    const {
      UUID,
      recipients,
      rewards,
      msgHash,
      tokensSum,
      amountNft,
      signature,
    } = await createRoundRewardList(accounts, tokens, roundId, owner);
    const status = 1;
    await rewarder.changePaymentStatus(status);

    let txCrRew = await rewarder.createRewards(
      recipients,
      msgHash,
      tokensSum,
      amountNft
    );

    for (let i = 0; i < rewards.length; i++) {
      try {
        let txWdRw = await rewarder
          .connect(accounts[i])
          .getRewards(
            signature[i].v,
            signature[i].r,
            signature[i].s,
            UUID[i],
            rewards[i]
          );
      } catch (error) {
        let errorMsg = "Rewarder: Payment status is paused";
        assert.equal(error.toString().includes(errorMsg), true, errorMsg);
      }
    }
  });

  it(" balance control", async () => {
    let roundId = 0;
    const {
      UUID,
      recipients,
      rewards,
      msgHash,
      tokensSum,
      amountNft,
      signature,
    } = await createRoundRewardList(accounts, tokens, roundId, owner);
    const status = 1;
    await rewarder.changePaymentStatus(status);

    // let txCrRew = await rewarder.createRewards(
    //   recipients,
    //   msgHash,
    //   tokensSum,
    //   amountNft
    // );

    for (let i = 0; i < accounts.length; i++) {
      try {
        let txWdRw = await rewarder
          .connect(accounts[i])
          .getRewards(
            signature[i].v,
            signature[i].r,
            signature[i].s,
            UUID[i],
            rewards[i]
          );
      } catch (error) {
        let errorMsg = "Rewarder: Payment status is paused";
        assert.equal(error.toString().includes(errorMsg), true, errorMsg);
      }
    }

    for(let j = 0; j < accounts.length; j++) {
        for(let i = 0; i < 5; i++) {
            let res = await tokens[i].balanceOf(accounts[j].address)
            // console.log({"account": accounts[j].address, "token": tokens[i].address, "amount": res.toString()})
        }
    }
  });

});
