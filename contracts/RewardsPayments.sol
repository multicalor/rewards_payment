// SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


// Тех задание на позицию Solidity dev

// Цель: Организовать выплату пользователям начисленных ERC20 и ERC721  токенов через смарт-контракт.

// Задача: Разработать контракт  выплаты вознаграждений в сети BSC. 
// Условия: 
// 1. Вознаграждения перечисляются в виде ERC20 и ERC721 токенов. 
// 2. Каждый этап выплаты вознаграждений ограничен количеством выплачиваемых токенов (общая сумма ERC20 токенов или количество ERC721 токенов)
// По какому принципу происходит распределение общей суммы токеноа?
// 3. В каждом этапе может быть выплата до 5 разных ЕRC20 токенов (например, USDT и WBNB) и 1 ERC721
// До 5 разных одновременно, или возможность сделать выплату в одном из 5 токенов на этап
// И если 5 разных токенов в одной выплате, то могут ли выплаты быть в ра
// 4. Начисление вознаграждения привязывается к конкретному адресу
// 5. Вознаграждение выплачивается транзакцией пользователя на контракт (комиссию платит пользователь)
// 6. Награждение выплачивается через трансфер токенов c баланса контракта на адрес получателя
// 7. Владелец контракта может в любой момент остановить выплату вознаграждений
// 8. Владелец контракта может инициировать новые этапы вознаграждений с отдельными лимитами по количеству выплачиваемых токенов
// 9. Вознаграждение может получить только тот адрес для которого был сгенерирован код

// WorkFlow:
// Входящие данные: список кошельков и сумма начисленной награды на каждый кошелек.

// 1. Владелец смарт контракта инициирует новый этап вознаграждений с указанием общей суммы выплаты по токенам

// 2. На стороне сервера при запросе на каждый адрес генерируется подпись и передается пользователю по открытому каналу

// 3. Пользователь, получив подпись, может провести транзакцию в смарт контракт и получить начисленное ему вознаграждение

// Необходимо: 
// 1. Разработать смарт-контракт выплаты вознаграждений
// 2. Разработать скрипт генерации кодов для пользователей на nodeJS (на вход получаем адрес кошелька пользователя, адрес токена и сумму (или количество для ЕRC721) на выходе подпись для транзакции)
// Бонусом:
// 1. Разработать скрипт деплоя смарт-контракта в тестовую сеть
// 2. Разработать тесты основного функционала смарт-контракта в связке со скриптом генерации кодов для выплаты

pragma solidity ^0.8.9;

contract RewardsPayments is Ownable {

    using SafeERC20 for IERC20;

    IERC721 NFT;

    enum PaymentStatuses {Active, Paused}

    PaymentStatuses paymentStatus;

    constructor(address nftAddress){
        NFT = IERC721(nftAddress);
        paymentStatus = PaymentStatuses.Active;
    }

    struct Token {
        address Address;
        uint Amount;
    }

    struct Reward {
        address recipient;
        uint roundId;
        Token[] tokens;
        uint nftId;
        // bytes32 sign;
        bool status;
    }

    struct RewardRound {
        uint roundId;
        address [] recipients;
        Token [] Amount;
        // Reward[] rewards;
    }

    mapping(address => Reward) public recipientsRewards;
    // mapping(uint => mapping(address => Reward)) public recipientsRewards;
    mapping(uint => RewardRound) public rewardsRounds;
    // address [] public recipients;
    uint rewardRoundId = 0;

    // RewardRound[] public rewardsRounds;

    event WithdrawReward(uint amount, uint when);

    function test()public view returns (Token memory){
        Token memory token = recipientsRewards[msg.sender].tokens[0];
        return token;
        // return amount;
    }

    function createRewardRound(Reward[] memory rewards, Token[] memory amount) public { //returns (Reward[] memory)returns (Token[] memory)
        for(uint i = 0; i < rewards.length; i++){
            rewardsRounds[rewardRoundId].recipients.push(rewards[i].recipient);
            createReward(rewards[i].recipient, rewards[i].tokens, rewards[i].nftId, rewards[i].roundId);
        }
        for(uint i = 0; i < amount.length; i++){
            rewardsRounds[rewardRoundId].Amount.push(Token(amount[i].Address, amount[i].Amount));
        }
        rewardsRounds[rewardRoundId].roundId = rewardRoundId;
        rewardRoundId++;
    }

    function createReward(address recipient, Token [] memory tokens, uint nftId, uint roundId)public returns (Reward memory){ //returns (Reward memory) address[] memory tokensAddresses, uint[] memory tokensAmounts
        recipientsRewards[recipient].recipient = recipient;
        recipientsRewards[recipient].roundId = roundId;
        recipientsRewards[recipient].nftId = nftId;
        recipientsRewards[recipient].status = false;

        for(uint i = 0; i < tokens.length; i++){
            recipientsRewards[recipient].tokens.push(Token(tokens[i].Address, tokens[i].Amount));
        }
        return recipientsRewards[recipient];
    }

    // function toAsciiString(address x) internal pure returns (string memory) {
    // bytes memory s = new bytes(40);
    // for (uint i = 0; i < 20; i++) {
    //     bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
    //     bytes1 hi = bytes1(uint8(b) / 16);
    //     bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
    //     s[2*i] = char(hi);
    //     s[2*i+1] = char(lo);            
    // }
    // return string(s);
    // }

    // function char(bytes1 b) internal pure returns (bytes1 c) {
    //     if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    //     else return bytes1(uint8(b) + 0x57);
    // }

    function payReward(string memory _hashedMessage, uint8 _v, bytes32 _r, bytes32 _s) public checkSign( _hashedMessage,  _v, _r, _s) {//checkPaymentStatus checkPaymentStatus(_v, _r, _s)
        require(paymentStatus == PaymentStatuses.Active, "PaymentStatuses: Reward is paused");
        require(recipientsRewards[msg.sender].recipient == msg.sender, "PaymentStatuses: No rewards for sender");
        for(uint8 i = 0; i < recipientsRewards[msg.sender].tokens.length; i++) {
            Token storage token = recipientsRewards[msg.sender].tokens[i];
            IERC20(token.Address).safeTransfer(msg.sender, token.Amount);//msg.sender,
        }
        NFT.safeTransferFrom(address(this), msg.sender, recipientsRewards[msg.sender].nftId);
        delete recipientsRewards[msg.sender];
    }

    // function getUserRevard(address recipient)public view returns (Reward memory){
    //     Reward memory revard = recipientsRewards[recipient];
    //     return revard;//.tokens[0].Amount;
    // }


    // function checkSign(){

    // }

    modifier checkPaymentStatus(uint8 _v, bytes32 _r, bytes32 _s){
        require(paymentStatus == PaymentStatuses.Active, 'Payment status is paused');
        _;
    }

    modifier checkSign(string memory _hashedMessage, uint8 _v, bytes32 _r, bytes32 _s){
        address signer = verifyString(_hashedMessage, _v, _r, _s);
        address owner = owner();
        require(signer == owner, "sign failed");
        _;
    }

    function changePaymentStatus(PaymentStatuses _status) external onlyOwner{
        paymentStatus = _status;
    }

    function verifyString(string memory message, uint8 v, bytes32 r, bytes32 s) public pure returns (address signer) {

        // The message header; we will fill in the length next
        string memory header = "\x19Ethereum Signed Message:\n000000";

        uint256 lengthOffset;
        uint256 length;
        assembly {
            // The first word of a string is its length
            length := mload(message)
            // The beginning of the base-10 message length in the prefix
            lengthOffset := add(header, 57)
        }

        // Maximum length we support
        require(length <= 999999);

        // The length of the message's length in base-10
        uint256 lengthLength = 0;

        // The divisor to get the next left-most message length digit
        uint256 divisor = 100000;

        // Move one digit of the message length to the right at a time
        while (divisor != 0) {

            // The place value at the divisor
            uint256 digit = length / divisor;
            if (digit == 0) {
                // Skip leading zeros
                if (lengthLength == 0) {
                    divisor /= 10;
                    continue;
                }
            }

            // Found a non-zero digit or non-leading zero digit
            lengthLength++;

            // Remove this digit from the message length's current value
            length -= digit * divisor;

            // Shift our base-10 divisor over
            divisor /= 10;

            // Convert the digit to its ASCII representation (man ascii)
            digit += 0x30;
            // Move to the next character and write the digit
            lengthOffset++;

            assembly {
                mstore8(lengthOffset, digit)
            }
        }

        // The null string requires exactly 1 zero (unskip 1 leading 0)
        if (lengthLength == 0) {
            lengthLength = 1 + 0x19 + 1;
        } else {
            lengthLength += 1 + 0x19;
        }

        // Truncate the tailing zeros from the header
        assembly {
            mstore(header, lengthLength)
        }

        // Perform the elliptic curve recover operation
        bytes32 check = keccak256(abi.encodePacked(header, message));

        return ecrecover(check, v, r, s);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure returns (bytes4){
        return IERC721Receiver.onERC721Received.selector;
    }
}

