// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  let tokens = []
  const accounts = await ethers.getSigners()
  const [owner] = accounts
  const NFT = await hre.ethers.getContractFactory("MyToken");
  const nft = await NFT.deploy();
  await nft.deployed();
  console.log("NFT address: " + nft.address)

  const Rewarder = await hre.ethers.getContractFactory("Rewarder");
  const rewarder = await Rewarder.deploy(nft.address);

  const TestToken = await ethers.getContractFactory("TestToken", owner);
  for(let i = 0; i < 10; i++) {
      const tt = await TestToken.deploy()
      await tt.deployed();
      console.log("Token_"+i, tt.address)
      
      //RewardsPayments contract TestToken refill
      let rewardsPayments_balance = ethers.utils.parseEther('1000')
      tt.transfer(rewarder.address, rewardsPayments_balance)
      rewardsPayments_balance = await tt.balanceOf(rewarder.address)
      // console.log({rewardsPayments_balance})
      tokens[i] = tt
  }

  // console.log("Lock with 1 ETH deployed to:", rewardsPayments.address);
  // Lock with 1 ETH deployed to: 0x9FB7d6fA125326d4405bB51c843623DfC6Df7409
  console.log("RewardsPayment deployed to:", rewarder.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
