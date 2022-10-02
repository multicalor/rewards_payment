const {expect} = require('chai')
const {ethers} = require('hardhat')

function createRewardList(accounts, tokens) {

    let tokensArg = []
    let nftIds = []
    let tokenId = 0
    for(let i = 0; i < 5; i++){//
        tokensArg.push({tokenAddress: tokens[i].address, amount:ethers.utils.parseUnits('1', 'mwei')})
        let nftId = tokenId+i
        nftIds.push(nftId)
    }

    let rewards = accounts.map((account, i)=>{
        console.log()
        
        return {recipient:account.address, tokens: tokensArg, nftIds}
    })
    return rewards
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
        // [owner, acc1, acc2, acc3, acc4, acc5, acc6] = accounts

        // function createRandomList(accounts, tokens) {
        //     tokensArg = []
        //     for(let i = 0; i < Math.random(4); i++){
        //         tokensArg.push({tokens: tokens[i], amount:ethers.utils.parseUnits('10000', 'mwei')})
        //     }
        //     // let tokens = tokens.map((token, i)=>{
        //     //     return {tokenAddress: token.address, amount:ethers.utils.parseUnits('10000', 'mwei')}
        //     // })
    
        //     let rewards = accounts.map((account, i)=>{
        //         console.log()
        //         return {recipient:account.address, tokens: tokens, nftId: i}
        //     })
        //     // let Reward = {
        //     //     recipient,
        //     //     tokens:[{Address:tokens[0].address, Amount:ethers.utils.parseUnits('10000', 'mwei')}, {Address:tokens[1].address, Amount:ethers.utils.parseUnits('100', 'mwei')}],//, ,tokensArg,//
        //     //     nftId,
        //     // }
    
        //     return rewards
        // }

    // NFT contract deploy
        const NFT = await ethers.getContractFactory("MyToken", owner);
        nft = await NFT.deploy()
        await nft.deployed()
         
        // Create a new RewardsPayments contract
        const RewardsPayments = await ethers.getContractFactory("RewardsPayments", owner);
        rewardsPayments = await RewardsPayments.deploy(nft.address)
        await rewardsPayments.deployed()
        

        // Create a new erc20 contract

        //TestTokens deploy
        const TestToken = await ethers.getContractFactory("TestToken", owner);
        for(let i = 0; i < 10; i++) {
            const tt = await TestToken.deploy()
            await tt.deployed();
            // console.log(tt.address)
            
            //RewardsPayments contract TestToken refill
            let rewardsPayments_balance = ethers.utils.parseEther('1000')
            tt.transfer(rewardsPayments.address, rewardsPayments_balance)
            rewardsPayments_balance = await tt.balanceOf(rewardsPayments.address)
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
        tether.transfer(rewardsPayments.address, rewardsPayments_balance)
        rewardsPayments_balance = await tether.balanceOf(rewardsPayments.address)
        // console.log({rewardsPayments_balance})
        tokens.push = tether


        // Create NFTis 

        
        for(let i = 0; i < 100; i++) {
            await nft.safeMint(rewardsPayments.address)    
        }
        const nft_balance = await nft.balanceOf(rewardsPayments.address)
        // console.log({nft_balance})
    })

    it("should be deployed", async () => {
        // console.log(rewardsPayments.address)
        // tokens.forEach(element => {
        //     console.log(element.address)
        // });
        // console.log({tether:tether.address, nft:nft.address})
        // console.log('success!')
    })

    // it("reward has created", async () => {
    //     // arguments
    //     // let recipient = acc1.address
    //     // let tokensAddresses = tokens.map(element=>element.address)
    //     // let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
    //     // let nftId = '1'
    //     // let roundId = '1'
    //     // let tokensArg = [{tokenAddress:acc1.address,amount:ethers.utils.parseUnits('100', 'mwei')}]
        
    //     let arguments = createRewardList(accounts, tokens)
    //     let {recipient, tokens, nftIds} = arguments[0]
    //     console.log('+++++++++++++',arguments[0])
    //     await rewardsPayments.createReward(recipient, tokens, nftIds, '0')
    //     // const res = await rewardsPayments.getUserRevard(recipient)
    //     // console.log({res:res.tokens})
    // })

    it("round reward has created", async () => {
        // arguments
        let arguments = createRewardList(accounts, tokens)
        // console.log({arguments})
        // let recipient = acc1.address
        // let tokensAddresses = tokens.map(element => element.address)
        // let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
        // let nftId = '1'
        // let roundId = '1'
        // let token = {address:acc1.address, amount:ethers.utils.parseUnits('100', 'mwei')}
        // let tokensArg = tokens.map((element) => {
        //     return {Address:element.address, Amount:ethers.utils.parseUnits('100', 'mwei')}
        // })

        
        // let Reward = {
        //     recipient,
        //     tokens:[{Address:tokens[0].address, Amount:ethers.utils.parseUnits('10000', 'mwei')}, {Address:tokens[1].address, Amount:ethers.utils.parseUnits('100', 'mwei')}],//, ,tokensArg,//
        //     nftId,
        // }
        // // console.log(Reward)
        // let rewards = [Reward] //new Array(3).fill(reward)
        // function rewardTokensSum(rewards){
        //     let amount = []
        //     let tmpArrAddresses = []
        //     rewards.forEach((elem)=>{
        //         elem.tokens.forEach((token)=>{              
        //             tmpArrAddresses.push(token.Address)
        //         })
        //     })
        //     tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));

        //     tmpArrAddresses.forEach((tokenAddress)=>{
        //         let Token = {Address: tokenAddress, Amount:ethers.utils.parseEther('0') }
        //         rewards.forEach((elem)=>{
        //             elem.tokens.forEach((token)=>{     
        //                 if(Token.Address === token.Address){
        //                     Token.Amount = Token.Amount.add(token.Amount)
        //                 }
        //             })
        //         })
        //         amount.push(Token)
        //     })
        //     return amount
        // }

        // let tokensAmount = rewardTokensSum(rewards)
        // console.log({tokensAmount})
        
        await rewardsPayments.createRewardRound(arguments)//, tokensAmount


        // let res = await rewardsPayments.test('0')
        // res = await rewardsPayments.rewardsRounds(0)
        // const res = await rewardsPayments.getUserRevard(recipient)
        // console.log({res})//res, , argument
    })

    it("sign reward", async () => {

        let message = owner.address
        // message = ethers.utils.arrayify(message);
        let hashMessage = ethers.utils.hashMessage(message)
        signature = await owner.signMessage(message);
        let sig = ethers.utils.splitSignature(signature);
        // console.log(sig)
        let recovered = ethers.utils.verifyMessage( message , signature )
        console.log({signer:recovered == owner.address})

        // https://docs.ethers.io/v4/cookbook-signing.html
        // https://www.web3.university/article/how-to-verify-a-signed-message-in-solidity
    })

    it("withdraw reward", async () => {        
        function rewardTokensSum(rewards){
            let amount = []
            let tmpArrAddresses = []
            rewards.forEach((elem)=>{
                elem.tokens.forEach((token)=>{              
                    tmpArrAddresses.push(token.Address)
                })
            })
            tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));

            tmpArrAddresses.forEach((tokenAddress)=>{
                let Token = {Address: tokenAddress, Amount:ethers.utils.parseEther('0') }
                rewards.forEach((elem)=>{
                    elem.tokens.forEach((token)=>{     
                        if(Token.Address === token.Address){
                            Token.Amount = Token.Amount.add(token.Amount)
                        }
                    })
                })
                amount.push(Token)
            })
            return amount
        }

        let arguments = createRewardList(accounts, tokens)
        await rewardsPayments.createRewardRound(arguments)//, tokensAmount

        let message = owner.address
        signature = await owner.signMessage(message);
        let sig = ethers.utils.splitSignature(signature);

        await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)

        for(let i = 0; i < tokens.length; i++){
            let balanceOf = await tokens[i].balanceOf(rewardsPayments.address)
            let balanceOfUser = await tokens[i].balanceOf(acc1.address)
            console.log({balance_after :balanceOf, user:balanceOfUser});
        }
        // https://docs.ethers.io/v4/cookbook-signing.html
        // https://www.web3.university/article/how-to-verify-a-signed-message-in-solidity
        // https://stackoverflow.com/questions/71866879/how-to-verify-message-in-wallet-connect-with-ethers-primarily-on-ambire-wallet
    })

    it("rewards counter test", async () => {
        let recipient = acc1.address
        let tokensAddresses = tokens.map(element => element.address)
        let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
        let nftId = '1'
        let roundId = '1'
        // let token = {address:acc1.address, amount:ethers.utils.parseUnits('100', 'mwei')}
        // let tokensArg = tokens.map((element) => {
        //     return {Address:element.address, Amount:ethers.utils.parseUnits('100', 'mwei')}
        // })

        
        let Reward = {
            recipient,
            tokens:[{Address:tokens[0].address, Amount:ethers.utils.parseUnits('100', 'mwei')}, {Address:tokens[1].address, Amount:ethers.utils.parseUnits('100', 'mwei')}],//, ,tokensArg,//
            nftId,
            // roundId,
            // status: false
        }
        // console.log(Reward)
        let rewards = [Reward] //new Array(3).fill(reward)
        function rewardTokensSum(rewards){
            let amount = []
            let tmpArrAddresses = []
            rewards.forEach((elem)=>{
                elem.tokens.forEach((token)=>{              
                    tmpArrAddresses.push(token.Address)
                })
            })
            tmpArrAddresses = tmpArrAddresses.filter((it, index) => index === tmpArrAddresses.indexOf(it = it.trim()));

            tmpArrAddresses.forEach((tokenAddress)=>{
                let Token = {Address: tokenAddress, Amount:ethers.utils.parseEther('0') }
                rewards.forEach((elem)=>{
                    elem.tokens.forEach((token)=>{     
                        if(Token.Address === token.Address){
                            Token.Amount = Token.Amount.add(token.Amount)
                        }
                    })
                })
                amount.push(Token)
            })
            return amount
        }

        let tokensAmount = rewardTokensSum(rewards)
        console.log({tokensAmount})

        let arguments = createRewardList(accounts, tokens)
        await rewardsPayments.createRewardRound(arguments)//, tokensAmount
        let rewardRoundId = '0'
        let tokenAddress = tokens[0].address
        let res = await rewardsPayments.test(rewardRoundId, tokenAddress)

        console.log({res:{tokenAddress, res}, tokensAmount})

        let message = owner.address
        // message = ethers.utils.arrayify(message);
        let hashMessage = ethers.utils.hashMessage(message)
        signature = await owner.signMessage(message);
        let sig = ethers.utils.splitSignature(signature);
        // console.log(sig)
        let recovered = ethers.utils.verifyMessage( message , signature )
        // console.log({signer:recovered == owner.address})

        for(let i = 0; i < tokens.length; i++){
            let balanceOf = await tokens[i].balanceOf(rewardsPayments.address)
            // console.log({balance_before :balanceOf});
        }

        await rewardsPayments.connect(acc1).payReward(message, sig.v,sig.r,sig.s)

        res = await rewardsPayments.connect(acc1).test(rewardRoundId, tokenAddress)
        let balanceOf = await tokens[0].balanceOf(acc1.address)
        console.log('++++++++++++',res, balanceOf)

        // for(let i = 0; i < tokens.length; i++){
        //     let balanceOf = await tokens[i].balanceOf(rewardsPayments.address)
        //     let balanceOfUser = await tokens[i].balanceOf(acc1.address)
        //     console.log({balance_after :balanceOf, user:balanceOfUser});
        // }
        // let res = await rewardsPayments.connect(acc1).test()
        // res = await rewardsPayments.rewardsRounds(0)
        // const res = await rewardsPayments.getUserRevard(recipient)
        // console.log({res})
        // 
        // acc1.address
        // https://docs.ethers.io/v4/cookbook-signing.html
        // https://www.web3.university/article/how-to-verify-a-signed-message-in-solidity
    })

    it("NFT tests", async () => {
        let nftId = '1'
        res = await rewardsPayments.testNft(nftId)

        console.log(res)
    })
    // let arguments = createRandomList()
    // console.log({arguments})
})