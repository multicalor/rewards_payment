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
// + 1. Вознаграждения перечисляются в виде ERC20 и ERC721 токенов. 
// + 2. Каждый этап выплаты вознаграждений ограничен количеством выплачиваемых токенов (общая сумма ERC20 токенов или количество ERC721 токенов)
// + 3. В каждом этапе может быть выплата до 5 разных ЕRC20 токенов (например, USDT и WBNB) и 1 ERC721
// + 4. Начисление вознаграждения привязывается к конкретному адресу
// + 5. Вознаграждение выплачивается транзакцией пользователя на контракт (комиссию платит пользователь)
// + 6. Награждение выплачивается через трансфер токенов c баланса контракта на адрес получателя
// 7. Владелец контракта может в любой момент остановить выплату вознаграждений
// + 8. Владелец контракта может инициировать новые этапы вознаграждений с отдельными лимитами по количеству выплачиваемых токенов
// + 9. Вознаграждение может получить только тот адрес для которого был сгенерирован код

// WorkFlow:
// + Входящие данные: список кошельков и сумма начисленной награды на каждый кошелек.

// + 1. Владелец смарт контракта инициирует новый этап вознаграждений с указанием общей суммы выплаты по токенам

// 2. На стороне сервера при запросе на каждый адрес генерируется подпись и передается пользователю по открытому каналу

// 3. Пользователь, получив подпись, может провести транзакцию в смарт контракт и получить начисленное ему вознаграждение

// Необходимо: 
// + 1. Разработать смарт-контракт выплаты вознаграждений
// 2. Разработать скрипт генерации кодов для пользователей на nodeJS (на вход получаем адрес кошелька пользователя, адрес токена и сумму (или количество для ЕRC721) на выходе подпись для транзакции)
// Бонусом:
// + 1. Разработать скрипт деплоя смарт-контракта в тестовую сеть
// +/- 2. Разработать тесты основного функционала смарт-контракта в связке со скриптом генерации кодов для выплаты

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
        address tokenAddress;
        uint amount;
    }

    struct Reward {
        address recipient;
        uint roundId;
        Token[] tokens;
        uint [] nftIds;
    }

    struct CreateRewardRoundInterface {
        address recipient;
        Token[] tokens;
        uint [] nftIds;
    }

    struct RewardRound {
        uint roundId;
        address [] recipients;
    }

    mapping(address => Reward) public recipientsRewards;
    mapping(uint => RewardRound) public rewardsRounds;
    mapping(uint => mapping(address => uint)) public rewardsTokensAmount;
    mapping(uint => uint) public roundNftamount;
    mapping(uint => uint) amountNfts;
    uint rewardRoundId;

    event WithdrawReward(Reward round);

    function createRewardRound(CreateRewardRoundInterface[] memory rewards) public onlyOwner { //returns (Reward[] memory)returns (Token[] memory), Token[] memory amount
        
        for(uint i = 0; i < rewards.length; i++){
            rewardsRounds[rewardRoundId].recipients.push(rewards[i].recipient);
            require(rewards[i].tokens.length <= 5, "PaymentStatuses: Reward from address more than 5 types of tokens");
            createReward(rewards[i].recipient, rewards[i].tokens, rewards[i].nftIds, rewardRoundId);
            for(uint j = 0; j < rewards[i].tokens.length; j++) {
                uint rewardOfToken = rewardsTokensAmount[rewardRoundId][rewards[i].tokens[j].tokenAddress];
                address tokenAddress = rewards[i].tokens[j].tokenAddress;
                uint amount = rewards[i].tokens[j].amount;
                rewardsTokensAmount[rewardRoundId][tokenAddress] = rewardOfToken + amount;
            }
        }
        rewardsRounds[rewardRoundId].roundId = rewardRoundId;
        rewardRoundId++;
    }

    function createReward(address recipient, Token [] memory tokens, uint [] memory nftIds, uint roundId)internal returns (Reward memory){ //returns (Reward memory) address[] memory tokensAddresses, uint[] memory tokensAmounts
        require(recipientsRewards[recipient].recipient == address(0), "The address is already participating in the rewards program");
        recipientsRewards[recipient].recipient = recipient;
        recipientsRewards[recipient].roundId = roundId;

        for(uint i = 0; i < tokens.length; i++){
            recipientsRewards[recipient].tokens.push(Token(tokens[i].tokenAddress, tokens[i].amount));
        }
        for(uint i = 0; i < nftIds.length; i++){
            require(NFT.ownerOf(nftIds[i]) == address(this), "PaymentStatuses: Wrong nftId");
            recipientsRewards[recipient].nftIds.push(nftIds[i]);
            amountNfts[rewardRoundId]++;
        }
        return recipientsRewards[recipient];
    }

    function payReward(string memory _hashedMessage, uint8 _v, bytes32 _r, bytes32 _s) external checkSign( _hashedMessage,  _v, _r, _s) {//checkPaymentStatus checkPaymentStatus(_v, _r, _s)
        require(paymentStatus == PaymentStatuses.Active, "PaymentStatuses: Reward is paused");
        require(recipientsRewards[msg.sender].recipient == msg.sender, "PaymentStatuses: No rewards for sender");
        uint roundId = recipientsRewards[msg.sender].roundId;
        for(uint8 i = 0; i < recipientsRewards[msg.sender].tokens.length; i++) {
            Token memory token = recipientsRewards[msg.sender].tokens[i];
            uint amount = token.amount;
            address tokenAddress = recipientsRewards[msg.sender].tokens[i].tokenAddress;
            uint roundTokenBalance = rewardsTokensAmount[roundId][tokenAddress];
            uint contractBalance = IERC20(token.tokenAddress).balanceOf(address(this));

            require(roundTokenBalance >= amount || contractBalance >= amount, "PaymentStatuses: Wrong reward balance");
            IERC20(token.tokenAddress).safeTransfer(msg.sender, amount);

            rewardsTokensAmount[roundId][tokenAddress] = roundTokenBalance - amount;
        }
        for(uint8 i = 0; i < recipientsRewards[msg.sender].nftIds.length; i++) {
            require( amountNfts[roundId] > 0 && NFT.balanceOf(address(this) ) > 0, "PaymentStatuses: ");
            NFT.safeTransferFrom(address(this), msg.sender, recipientsRewards[msg.sender].nftIds[i]);
            amountNfts[roundId]--;
        }

        emit WithdrawReward(recipientsRewards[msg.sender]);
        delete recipientsRewards[msg.sender];

    }

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

    function verifyHash(bytes32 hash, uint8 v, bytes32 r, bytes32 s) public pure
        returns (address signer) {

        bytes32 messageDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));//(...));

        return ecrecover(messageDigest, v, r, s);
    }
}

