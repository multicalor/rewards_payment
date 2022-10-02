require('dotenv').config()
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    rinkeby:{
      url: 'https://rinkeby.infura.io/v3/55e9256b995d45b88010b2522718d3a6',
      accounts:['0x'+process.env.ACCOUNT_PK]
    },
    mainnet:{
      url: 'https://mainnet.infura.io/v3/'+process.env.RINKEBY_APIKEY,
      accounts:['0x'+process.env.ACCOUNT_PK]
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETERSCAN_API_KEY
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
