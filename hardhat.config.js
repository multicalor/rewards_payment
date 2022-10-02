require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    rinkeby:{
      url: 'https://rinkeby.infura.io/v3/55e9256b995d45b88010b2522718d3a6',
      accounts:['0x'+"899a362278c6afb2a2e6ef0b4b10bb0c38eb516cd19f998a77a650e2dd02dcf6"]
    },
    mainnet:{
      url: 'https://mainnet.infura.io/v3/55e9256b995d45b88010b2522718d3a6',
      accounts:['0x'+"899a362278c6afb2a2e6ef0b4b10bb0c38eb516cd19f998a77a650e2dd02dcf6"]
    }
  },
  solidity: {
    compilers: [
        {
          version:"0.4.17"
        },
        {
          version:"0.8.9",
          settings:{}
        }
      ],
    overrides: {
      "contracts/TetherToken.sol": {
        version: "0.4.17",
        settings: { }
      }
    }
  }
};
