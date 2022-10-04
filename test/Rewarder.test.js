const {expect, assert} = require('chai')
const {ethers} = require('hardhat')

function createRewardList(accounts, tokens) {

    // let nftIds = []
    let tokenId = 0
    // for(let i = 0; i < 5; i++){//
    //     tokensArg.push({tokenAddress: tokens[i].address, amount:ethers.utils.parseUnits('1', 'mwei')})
    //     let nftId = tokenId+i
    //     nftIds.push(nftId)
    // }

    let rewards = accounts.map((account)=>{
        let tokensArg = []
        let nftIds = []
        for(let i = 0; i < 5; i++){//
            tokensArg.push({tokenAddress: tokens[i].address, amount:ethers.utils.parseUnits('1', 'mwei')})
            // let nftId = tokenId+i
            nftIds.push(tokenId)
            tokenId++
        }
        return {recipient:account.address, tokens: tokensArg, nftIds}
    })
    return rewards
}
function rewardTokensSum(rewards){
    let amount = []
    let tmpArrAddresses = []
    rewards.forEach((elem)=>{
        elem.tokens.forEach((token)=>{              
            tmpArrAddresses.push(token.tokenAddress)
        })
    })
    tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));
    // let Token = {tokenAddress: '', amount:ethers.utils.parseEther('0') }
    tmpArrAddresses.forEach((tokenAddress)=>{
        let Token = {tokenAddress: tokenAddress, amount:ethers.utils.parseEther('0') }
        // Token[tokenAddress] = tokenAddress
        rewards.forEach((elem)=>{
            elem.tokens.forEach((token)=>{     
                if(Token.tokenAddress === token.tokenAddress){
                    Token.amount = Token.amount.add(token.amount)
                }
            })
        })
        amount.push(Token)
    })
    return amount
}


describe("RewardsPayments", () => {
    let owner, acc1, acc2, acc3, acc4, acc5, acc6
    let tokens = []
    let tether, nft
    let accounts
    beforeEach(async() => {
        accounts = await ethers.getSigners()
        owner = accounts[0]
        acc1 = accounts[1]

    // NFT contract deploy
        const NFT = await ethers.getContractFactory("MyToken", owner);
        nft = await NFT.deploy()
        await nft.deployed()
         
        // Create a new RewardsPayments contract
        const Rewarder = await ethers.getContractFactory("Rewarder", owner);
        rewarder = await Rewarder.deploy(nft.address)
        await rewarder.deployed()
        
        // rewardsPayments.on("WithdrawReward", (reward) => {
        //     console.log(reward);
        // });

        // Create a new erc20 contract

        //TestTokens deploy
        const TestToken = await ethers.getContractFactory("TestToken", owner);
        for(let i = 0; i < 10; i++) {
            const tt = await TestToken.deploy()
            await tt.deployed();
            // console.log(tt.address)
            
            //RewardsPayments contract TestToken refill
            let rewardsPayments_balance = ethers.utils.parseEther('1000')
            tt.transfer(rewarder.address, rewardsPayments_balance)
            rewardsPayments_balance = await tt.balanceOf(rewarder.address)
            // console.log({rewardsPayments_balance})
            tokens[i] = tt
        }
     
        const Tether = await ethers.getContractFactory("TetherToken", owner);
        tether = await Tether.deploy(
            _initialSupply='1000000000',
            _name='Tether',
            _symbol='USDT',
            _decimals='6'
        );
        await tether.deployed();

  

        //RewardsPayments contract TestToken refill
        let rewardsPayments_balance = ethers.utils.parseUnits('100', 'mwei')
        tether.transfer(rewarder.address, rewardsPayments_balance)
        rewardsPayments_balance = await tether.balanceOf(rewarder.address)
        // console.log({rewardsPayments_balance})
        tokens.push = tether


        // Create NFTis 

        
        for(let i = 0; i < 100; i++) {
            await nft.safeMint(rewarder.address)    
        }
        const nft_balance = await nft.balanceOf(rewarder.address)
        // console.log({nft_balance})
    })

    it("megHash test", async () => {
        // let rewardList = createRewardList(accounts, tokens)
        // let rewardedTokens = rewardTokensSum(rewardList)

        let _UUID = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(['address'],[acc1.address])
          )

        const RewardReceiptArray = [
            {
                recipient: owner.address,
                tokens: [{tokenAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', amount:ethers.utils.parseEther('0')}],
                nftIds:[1,2]
            },
            {
                recipient: acc1.address,
                tokens: [{tokenAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', amount:ethers.utils.parseEther('0')}],
                nftIds:[1,2]
            }

        ]
        
        // console.log(acc1.address, _UUID, [
        //     {tokenAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', amount:ethers.utils.parseEther('0'), nftIds:[1,2]}]
        //     )

            let inputsIndex = [
            {
              "type": "address"
            },
            {
              "type": "bytes32"
            },
            {
              "components": [
                {
                  "name": "recipient",
                  "type": "address"
                },
                {
                  "components": [
                    {
                      "name": "tokenAddress",
                      "type": "address"
                    },
                    {
                      "name": "amount",
                      "type": "uint256"
                    }
                  ],
                  "name": "tokens",
                  "type": "tuple[]"
                },
                {
                  "name": "nftIds",
                  "type": "uint256[]"
                }
              ],
              "type": "tuple[]"
            }
          ]

        let expect = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                inputsIndex,

                [ owner.address, _UUID, RewardReceiptArray ],
            )
        )
        console.log({expect})
        let res = await rewarder.test(acc1.address, _UUID, RewardReceiptArray )
        console.log(res == expect,res )

        // tokens = [{tokenAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', amount:ethers.utils.parseEther('0'),nftIds:[1,2]}]
                // [
                //     {
                //     "type":"address"
                //     },
                //     "bytes32",
                //         {
                //         "components": [
                //             {
                //             "name": "tokenAddress",
                //             "type": "address"
                //             },
                //             {
                //             "name": "amount",
                //             "type": "uint256"
                //             },
                //             {
                //             "name":"nftIds",
                //             "type": "uint256[]"
                //             }
                //         ],
                //         "type": "tuple[]"
                //         }
                // ],

            })

// https://ethereum.stackexchange.com/questions/122221/how-to-use-function-recover-from-ecdsa-library

    it("reward has created", async () => {
        let _UUID = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(['address'],[acc1.address])
          )

        const RewardReceiptArray = [
            {
                recipient: owner.address,
                tokens: [{tokenAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', amount:ethers.utils.parseEther('1')}],
                nftIds:[1,2]
            },
            {
                recipient: acc1.address,
                tokens: [{tokenAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', amount:ethers.utils.parseEther('0')}],
                nftIds:[1,2]
            }

        ]
        let inputsIndex = [
            {
              "type": "address"
            },
            {
              "type": "bytes32"
            },
            {
              "components": [
                {
                  "name": "recipient",
                  "type": "address"
                },
                {
                  "components": [
                    {
                      "name": "tokenAddress",
                      "type": "address"
                    },
                    {
                      "name": "amount",
                      "type": "uint256"
                    }
                  ],
                  "name": "tokens",
                  "type": "tuple[]"
                },
                {
                  "name": "nftIds",
                  "type": "uint256[]"
                }
              ],
              "type": "tuple[]"
            }
          ]

        let msgHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                inputsIndex,
                [ owner.address, _UUID, RewardReceiptArray ],
            )
        )

        // const signature = await owner.signMessage(
        //     ethers.utils.arrayify(
        //       ethers.utils.keccak256(
        //         ethers.utils.defaultAbiCoder.encode(
        //             inputsIndex,
        //             [ acc1.address, _UUID, RewardReceiptArray ],
        //         )
        //       )
        //     )
        //   );
        // let messageHash = ethers.utils.id(msgHash);
        
        let messageHashBytes = ethers.utils.arrayify(msgHash)
        let flatSig = await owner.signMessage(messageHashBytes);
        let signer = ethers.utils.verifyMessage( msgHash , flatSig )
        let sig = ethers.utils.splitSignature(flatSig);
        // console.log({sig, signature})

        // bytes32 _signature,
        // bytes32 _UUID,//uuid to proceed identical receipts to always generate different hashes
        // RewardReceipt[] calldata _rewardReceipts
        let recovered = await rewarder.getRewards(sig.v, sig.r, sig.s, _UUID, RewardReceiptArray)
        // recovered = await recovered.wait();
        // console.log({recovered, owner:owner.address, msgHash, signer})
        let rewardList = createRewardList(accounts, tokens)
        console.log(rewardList)
        // console.log(accounts.map(account=> account.address))
        // console.log({sign: owner.address == recovered})
        // let messageHash = ethers.utils.id("Hello World");

        
        // let sig = ethers.utils.splitSignature(flatSig);
        // let recovered = await rewardsPayments.verifyHash(messageHash, sig.v, sig.r, sig.s);
            // console.log({sign: owner.address == recovered})


    })

})

//     // it("reward has created", async () => {
//     //     // arguments
//     //     // let recipient = acc1.address
//     //     // let tokensAddresses = tokens.map(element=>element.address)
//     //     // let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
//     //     // let nftId = '1'
//     //     // let roundId = '1'
//     //     // let tokensArg = [{tokenAddress:acc1.address,amount:ethers.utils.parseUnits('100', 'mwei')}]
        
//     //     let arguments = createRewardList(accounts, tokens)
//     //     let {recipient, tokens, nftIds} = arguments[0]
//     //     console.log('+++++++++++++',arguments[0])
//     //     await rewardsPayments.createReward(recipient, tokens, nftIds, '0')
//     //     // const res = await rewardsPayments.getUserRevard(recipient)
//     //     // console.log({res:res.tokens})
//     // })

//     it("round reward has created", async () => {
//         // arguments
//         let arguments = createRewardList(accounts, tokens)
//         // console.log({arguments})
//         // let recipient = acc1.address
//         // let tokensAddresses = tokens.map(element => element.address)
//         // let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
//         // let nftId = '1'
//         // let roundId = '1'
//         // let token = {address:acc1.address, amount:ethers.utils.parseUnits('100', 'mwei')}
//         // let tokensArg = tokens.map((element) => {
//         //     return {Address:element.address, Amount:ethers.utils.parseUnits('100', 'mwei')}
//         // })

        
//         // let Reward = {
//         //     recipient,
//         //     tokens:[{Address:tokens[0].address, Amount:ethers.utils.parseUnits('10000', 'mwei')}, {Address:tokens[1].address, Amount:ethers.utils.parseUnits('100', 'mwei')}],//, ,tokensArg,//
//         //     nftId,
//         // }
//         // // console.log(Reward)
//         // let rewards = [Reward] //new Array(3).fill(reward)
//         // function rewardTokensSum(rewards){
//         //     let amount = []
//         //     let tmpArrAddresses = []
//         //     rewards.forEach((elem)=>{
//         //         elem.tokens.forEach((token)=>{              
//         //             tmpArrAddresses.push(token.Address)
//         //         })
//         //     })
//         //     tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));

//         //     tmpArrAddresses.forEach((tokenAddress)=>{
//         //         let Token = {Address: tokenAddress, Amount:ethers.utils.parseEther('0') }
//         //         rewards.forEach((elem)=>{
//         //             elem.tokens.forEach((token)=>{     
//         //                 if(Token.Address === token.Address){
//         //                     Token.Amount = Token.Amount.add(token.Amount)
//         //                 }
//         //             })
//         //         })
//         //         amount.push(Token)
//         //     })
//         //     return amount
//         // }

//         // let tokensAmount = rewardTokensSum(rewards)
//         // console.log({tokensAmount})
        
//         await rewardsPayments.createRewardRound(arguments)//, tokensAmount


//         // let res = await rewardsPayments.test('0')
//         // res = await rewardsPayments.rewardsRounds(0)
//         // const res = await rewardsPayments.getUserRevard(recipient)
//         // console.log({res})//res, , argument
//     })

//     it("sign reward", async () => {
//         // string message
//         // let message = owner.address
//         // signature = await owner.signMessage(message);
//         // let sig = ethers.utils.splitSignature(signature);
//         // // console.log(sig)
//         // let recovered = ethers.utils.verifyMessage( message , signature )
//         // console.log({signer:recovered == owner.address})

//         // hashMessage
//         let messageHash = ethers.utils.id("Hello World");
//         let messageHashBytes = ethers.utils.arrayify(messageHash)
//         let flatSig = await owner.signMessage(messageHashBytes);
//         let sig = ethers.utils.splitSignature(flatSig);
//         let recovered = await rewardsPayments.verifyHash(messageHash, sig.v, sig.r, sig.s);
//         // console.log({sign: owner.address == recovered})

//         // https://docs.ethers.io/v4/cookbook-signing.html
//         // https://www.web3.university/article/how-to-verify-a-signed-message-in-solidity
//     })

//     it("withdraw reward", async () => {        
//         // function rewardTokensSum(rewards){
//         //     let amount = []
//         //     let tmpArrAddresses = []
//         //     rewards.forEach((elem)=>{
//         //         elem.tokens.forEach((token)=>{              
//         //             tmpArrAddresses.push(token.Address)
//         //         })
//         //     })
//         //     tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));

//         //     tmpArrAddresses.forEach((tokenAddress)=>{
//         //         let Token = {Address: tokenAddress, Amount:ethers.utils.parseEther('0') }
//         //         rewards.forEach((elem)=>{
//         //             elem.tokens.forEach((token)=>{     
//         //                 if(Token.Address === token.Address){
//         //                     Token.Amount = Token.Amount.add(token.Amount)
//         //                 }
//         //             })
//         //         })
//         //         amount.push(Token)
//         //     })
//         //     return amount
//         // }

//         let arguments = createRewardList(accounts, tokens)
//         await rewardsPayments.createRewardRound(arguments)//, tokensAmount

//         let message = owner.address
//         signature = await owner.signMessage(message);
//         let sig = ethers.utils.splitSignature(signature);

//         await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)

//         for(let i = 0; i < tokens.length; i++){
//             let balanceOf = await tokens[i].balanceOf(rewardsPayments.address)
//             let balanceOfUser = await tokens[i].balanceOf(acc1.address)
//             // console.log({balance_after :balanceOf, user:balanceOfUser});
//         }
//         // https://docs.ethers.io/v4/cookbook-signing.html
//         // https://www.web3.university/article/how-to-verify-a-signed-message-in-solidity
//         // https://stackoverflow.com/questions/71866879/how-to-verify-message-in-wallet-connect-with-ethers-primarily-on-ambire-wallet
//     })

//     it("rewards counter test", async () => {
//         let recipient = acc1.address
//         let tokensAddresses = tokens.map(element => element.address)
//         let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
//         let nftId = '1'
//         let roundId = '1'
//         // let token = {address:acc1.address, amount:ethers.utils.parseUnits('100', 'mwei')}
//         // let tokensArg = tokens.map((element) => {
//         //     return {Address:element.address, Amount:ethers.utils.parseUnits('100', 'mwei')}
//         // })

        
//         // let Reward = {
//         //     recipient,
//         //     tokens:[{Address:tokens[0].address, Amount:ethers.utils.parseUnits('100', 'mwei')}, {Address:tokens[1].address, Amount:ethers.utils.parseUnits('100', 'mwei')}],//, ,tokensArg,//
//         //     nftId,
//         //     // roundId,
//         //     // status: false
//         // }
//         // // console.log(Reward)
//         // let rewards = [Reward] //new Array(3).fill(reward)
//         // function rewardTokensSum(rewards){
//         //     let amount = []
//         //     let tmpArrAddresses = []
//         //     rewards.forEach((elem)=>{
//         //         elem.tokens.forEach((token)=>{              
//         //             tmpArrAddresses.push(token.tokenAddress)
//         //         })
//         //     })
//         //     tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));
//         //     // let Token = {tokenAddress: '', amount:ethers.utils.parseEther('0') }
//         //     tmpArrAddresses.forEach((tokenAddress)=>{
//         //         let Token = {tokenAddress: tokenAddress, amount:ethers.utils.parseEther('0') }
//         //         // Token[tokenAddress] = tokenAddress
//         //         rewards.forEach((elem)=>{
//         //             elem.tokens.forEach((token)=>{     
//         //                 if(Token.tokenAddress === token.tokenAddress){
//         //                     Token.amount = Token.amount.add(token.amount)
//         //                 }
//         //             })
//         //         })
//         //         amount.push(Token)
//         //     })
//         //     return amount
//         // }


//         let arguments = createRewardList(accounts, tokens)

//         let tokensAmount = rewardTokensSum(arguments)

//         // console.log({tokensAmount})

//         await rewardsPayments.createRewardRound(arguments)//, tokensAmount
//         let rewardRoundId = '0'
//         let tokenAddress = tokens[0].address
//         // let res = await rewardsPayments.test(rewardRoundId, tokenAddress)

//         // console.log({res:{tokenAddress, res}, tokensAmount})

//         let message = owner.address
//         // message = ethers.utils.arrayify(message);
//         let hashMessage = ethers.utils.hashMessage(message)
//         signature = await owner.signMessage(message);
//         let sig = ethers.utils.splitSignature(signature);
//         // console.log(sig)
//         let recovered = ethers.utils.verifyMessage( message , signature )
//         // console.log({signer:recovered == owner.address})

//         for(let i = 0; i < tokens.length; i++){
//             let balanceOf = await tokens[i].balanceOf(rewardsPayments.address)
//             // console.log({balance_before :balanceOf});
//         }

//         await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)

//         // res = await rewardsPayments.connect(acc1).test(rewardRoundId, tokenAddress)
//         let balanceOf = await tokens[0].balanceOf(acc1.address)
//         // console.log('++++++++++++',res, balanceOf)

//         // for(let i = 0; i < tokens.length; i++){
//         //     let balanceOf = await tokens[i].balanceOf(rewardsPayments.address)
//         //     let balanceOfUser = await tokens[i].balanceOf(acc1.address)
//         //     console.log({balance_after :balanceOf, user:balanceOfUser});
//         // }
//         // let res = await rewardsPayments.connect(acc1).test()
//         // res = await rewardsPayments.rewardsRounds(0)
//         // const res = await rewardsPayments.getUserRevard(recipient)
//         // console.log({res})
//         // 
//         // acc1.address
//         // https://docs.ethers.io/v4/cookbook-signing.html
//         // https://www.web3.university/article/how-to-verify-a-signed-message-in-solidity
//     })
//     it("check duplicate addresses in rewards", async () => {
//     })
//     it("check payment change status", async () => {
//     })
//     it("check full reward widhdrw", async () => {
//         let arguments = createRewardList(accounts, tokens)
//         console.log(arguments)
//         let tokensAmount = rewardTokensSum(arguments)

//         await rewardsPayments.createRewardRound(arguments)
//         let before_contract_balances = []
//         let after_contract_balances = []
        

//         let before_contract_nft_balance = await nft.balanceOf(rewardsPayments.address)

//         for(let j = 0; j < 5; j++){
//             let contract_balance = await tokens[j].balanceOf(rewardsPayments.address)
//             before_contract_balances.push(contract_balance)
//         }
//         console.log(before_contract_balances)
//         for(let i = 0; i < accounts.length; i++){
//             let message = accounts[i].address
//             // let owner = accounts[i]
//             signature = await owner.signMessage(message);
//             let sig = ethers.utils.splitSignature(signature);
//             await rewardsPayments.connect(accounts[i]).payReward(message, sig.v,sig.r,sig.s)
//         }

//         for(let j = 0; j < 5; j++){
//             let contract_balance = await tokens[j].balanceOf(rewardsPayments.address)
//             after_contract_balances.push(contract_balance)
//         }
//         let after_contract_nft_balance = await nft.balanceOf(rewardsPayments.address)
//         // expect(contract_balance).to.eq(init_balances.owner.sub(amount))
//         console.log(before_contract_balances, after_contract_balances, before_contract_nft_balance, after_contract_nft_balance)

//     })
//     it("No rewards for sender", async () => {
//         let arguments = createRewardList(accounts, tokens)
//         console.log(arguments)
//         let tokensAmount = rewardTokensSum(arguments)

//         await rewardsPayments.createRewardRound(arguments)
//         let before_contract_balances = []
//         let after_contract_balances = []
        

//         let before_contract_nft_balance = await nft.balanceOf(rewardsPayments.address)

//         for(let j = 0; j < 5; j++){
//             let contract_balance = await tokens[j].balanceOf(rewardsPayments.address)
//             before_contract_balances.push(contract_balance)
//         }
//         console.log(before_contract_balances)
//         for(let i = 0; i < accounts.length; i++){
//             let message = accounts[i].address
//             // let owner = accounts[i]
//             signature = await owner.signMessage(message);
//             let sig = ethers.utils.splitSignature(signature);
//             await rewardsPayments.connect(accounts[i]).payReward(message, sig.v,sig.r,sig.s)
//         }

//         for(let j = 0; j < 5; j++){
//             let contract_balance = await tokens[j].balanceOf(rewardsPayments.address)
//             after_contract_balances.push(contract_balance)
//         }
//         let after_contract_nft_balance = await nft.balanceOf(rewardsPayments.address)
//         // expect(contract_balance).to.eq(init_balances.owner.sub(amount))
//         console.log(before_contract_balances, after_contract_balances, before_contract_nft_balance, after_contract_nft_balance)
//         let message = owner.address
//         signature = await owner.signMessage(message);
//         let sig = ethers.utils.splitSignature(signature);
//         try{
//             await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)
//         } catch (error){
//             let errorMsg = 'PaymentStatuses: No rewards for sender'
//             assert.equal(error.toString().includes(errorMsg), true, errorMsg)
//         }

//     })
//     it("check rewards pause", async () => {   
//             let arguments = createRewardList(accounts, tokens)
//             await rewardsPayments.createRewardRound(arguments)//, tokensAmount
    
//             let message = owner.address
//             signature = await owner.signMessage(message);
//             let sig = ethers.utils.splitSignature(signature);

//             await rewardsPayments.changePaymentStatus('1')

//             try{
//                 await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)
//             } catch (error){
//                 let errorMsg = 'PaymentStatuses: Reward is paused'
//                 assert.equal(error.toString().includes(errorMsg), true, errorMsg)
//             }

//             await rewardsPayments.changePaymentStatus('0')

//             await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)
//     })

//     it("check event emit", async () => {   



//         let arguments = createRewardList(accounts, tokens)
//         await rewardsPayments.createRewardRound(arguments)//, tokensAmount

//         let message = owner.address
//         signature = await owner.signMessage(message);
//         let sig = ethers.utils.splitSignature(signature);

//         let transaction = await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)

// })
//     // it("check ", async () => {
//     // })
//     // it("check ", async () => {
//     // })


//     // let arguments = createRandomList()
//     // console.log({arguments})
// })