const {expect} = require('chai')
const {ethers} = require('hardhat')

describe("RewardsPayments", () => {
    let owner, acc1, acc2, acc3, acc4, acc5, acc6
    let tokens = []
    let tether
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
            console.log(tt.address)
            
            //RewardsPayments contract TestToken refill
            let rewardsPayments_balance = ethers.utils.parseEther('1000000000')
            tt.transfer(rewardsPayments.address, rewardsPayments_balance)
            rewardsPayments_balance = await tt.balanceOf(rewardsPayments.address)
            console.log({rewardsPayments_balance})
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
        console.log({rewardsPayments_balance})
        tokens.push = tether
    })

    it("should be deployed", async () => {
        console.log(rewardsPayments.address)
        tokens.forEach(element => {
            console.log(element.address)
        });
        console.log({tether:tether.address})
        console.log('success!')
    })

    it("reward has created", async () => {
        let recipient = acc1

        // rewardsPayments.createReward(address recipient, address[] calldata tokensAddresses, uint[] calldata tokensAmounts, uint nftId, uint roundId)public returns (Reward memory)
    })
})