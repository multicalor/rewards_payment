const {expect} = require('chai')
const {ethers} = require('hardhat')

describe("RewardsPayments", () => {
    let owner, acc1, acc2, acc3, acc4, acc5, acc6
    let tokens = []
    let tether, nft
    beforeEach(async() => {
        [owner, acc1, acc2, acc3, acc4, acc5, acc6] = await ethers.getSigners()
        
        // Create a new RewardsPayments contract
        const RewardsPayments = await ethers.getContractFactory("RewardsPayments", owner);
        rewardsPayments = await RewardsPayments.deploy()
        await rewardsPayments.deployed()
        

        // Create a new erc20 contract

        //TestTokens deploy
        const TestToken = await ethers.getContractFactory("TestToken", owner);
        for(let i = 0; i < 10; i++) {
            const tt = await TestToken.deploy()
            await tt.deployed();
            // console.log(tt.address)
            
            //RewardsPayments contract TestToken refill
            let rewardsPayments_balance = ethers.utils.parseEther('1000000000')
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

        // NFT contract deploy
        const NFT = await ethers.getContractFactory("MyToken", owner);
        nft = await NFT.deploy()
        await nft.deployed()
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

    it("reward has created", async () => {
        // arguments
        let recipient = acc1.address
        let tokensAddresses = tokens.map(element=>element.address)
        let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
        let nftId = '1'
        let roundId = '1'
        let tokensArg = [{Address:acc1.address,Amount:ethers.utils.parseUnits('100', 'mwei')}]
        

        await rewardsPayments.createReward(recipient, tokensArg, nftId,roundId)
        const res = await rewardsPayments.getUserRevard(recipient)
        // console.log({res:res.tokens})
    })

    it("round reward has created", async () => {
        // arguments
        let recipient = acc1.address
        let tokensAddresses = tokens.map(element => element.address)
        let tokensAmounts = new Array(tokensAddresses.length).fill(ethers.utils.parseUnits('100', 'mwei'))   //ethers.utils.parseUnits('100', 'mwei'),ethers.utils.parseUnits('100', 'mwei'),3,4,5,6,7,8,9,10,11]
        let nftId = '1'
        let roundId = '1'
        let token = {address:acc1.address, amount:ethers.utils.parseUnits('100', 'mwei')}
        let tokensArg = tokens.map((element) => {
            return {Address:element.address, Amount:ethers.utils.parseUnits('100', 'mwei')}
        })

        
        let Reward = {
            recipient,
            tokens:[{Address:acc1.address,Amount:ethers.utils.parseUnits('100', 'mwei')}, {Address:acc1.address,Amount:ethers.utils.parseUnits('100', 'mwei')}],//, ,tokensArg,//
            nftId,
            roundId,
            status:false
        }
        console.log(Reward)
            // struct Reward {
    //     address recipient;
    //     uint roundId;
    //     Token[] tokens;
    //     uint nftId;
    //     bool status;
    // }

    // struct Token {
    //     address Addresses;
    //     uint Amount;
    // }
        let argument = [Reward] //new Array(3).fill(reward)
        
        

        await rewardsPayments.createRewardRound(argument)
        const res = await rewardsPayments.getUserRevard(recipient)
        console.log({res:res.tokens})//res, , argument
    })

    it("sign reward", async () => {
        let message = owner.address
        signature = await owner.signMessage(message);
        let sig = ethers.utils.splitSignature(signature);
        let recovered = ethers.utils.verifyMessage( message , signature )
        console.log({signer:recovered == owner.address})
        // https://docs.ethers.io/v4/cookbook-signing.html
        // https://www.web3.university/article/how-to-verify-a-signed-message-in-solidity
    })
})