// SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


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

    enum PaymentStatuses {Active, Paused}

    PaymentStatuses paymentStatus;

    constructor(){
        paymentStatus = PaymentStatuses.Active;
    }

    struct Token {
        address Addresses;
        uint Amount;
    }

    struct Reward {
        address recipient;
        uint roundId;
        Token[] tokens;
        uint nftId;
        bool status;
    }

    struct RewardRound {
        uint roundId;
        address [] recipients;
        // Reward[] rewards;
    }

    

    mapping(address => Reward) public recipientsRewards;
    address [] public recipients;

    RewardRound[] rewardsRounds;

    event WithdrawReward(uint amount, uint when);

    function createReward(address recipient, address[] calldata tokensAddresses, uint[] calldata tokensAmounts, uint nftId, uint roundId)public returns (Reward memory){ //returns (Reward memory)
        recipientsRewards[recipient].recipient = recipient;
        recipientsRewards[recipient].roundId = roundId;
        recipientsRewards[recipient].nftId = nftId;
        recipientsRewards[recipient].status = false;
        // recipientsRewards[recipient].tokens.push(Token(0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005, 3));
        // recipientsRewards[recipient].tokens = Token[] tokens;
        // recipients.push(recipient);

        for(uint i = 0; i < tokensAddresses.length; i++){
            recipientsRewards[recipient].tokens.push(Token(tokensAddresses[i], tokensAmounts[i]));
        //     // Token storage token = Token(tokensAddresses[i], tokensAmounts[i]);
        //     // tokens[i] = token;
        }


        // Reward memory rewardAmoun = Reward(recipient, roundId, tokens, nftId, false);
        // recipientsRewards[recipient] = rewardAmoun;
        return recipientsRewards[recipient];
    }

    function getUserRevard(address recipient)public view returns (uint){
        return recipientsRewards[recipient].tokens[0].Amount;
        // Token memory result = recipientsRewards[recipient].tokens;
        // Token [] memory result; //= recipientsRewards[recipient].tokens;

        // for(uint i = 0; i < recipientsRewards[recipient].tokens.length; i++){
        //     result[i] = Token(recipientsRewards[recipient].tokens[i].Addresses, recipientsRewards[recipient].tokens[i].Amount);
        //     // result[i] = recipientsRewards[recipient].tokens[i];
        //     // recipientsRewards[recipient].tokens.push(Token(tokensAddresses[i], tokensAmounts[i]));
        // //     // Token storage token = Token(tokensAddresses[i], tokensAmounts[i]);
        // //     // tokens[i] = token;
        // }

        // return result;
    }


    // function checkSign(){

    // }

    modifier checkPaymentStatus(){
        require(paymentStatus == PaymentStatuses.Active, 'Payment status is paused');
        _;
    }

    // function changePaymentStatus(PaymentStatuses _status) external onlyOwner{
    //     paymentStatus = _status;
    // }



    // function abortRewardRound()public returns(bool){
    //     return true;
    // }

    // function withdrawReward() public view checkPaymentStatus returns(bool){
        
    //     return true;
    // }

    // function getRounds(){

    // }

    // function getRecepientReward

    // function onERC721Received(
    //     address operator,
    //     address from,
    //     uint256 tokenId,
    //     bytes calldata data
    // ) external pure returns (bytes4){
    //     return IERC721Receiver.onERC721Received.selector;
    // }
}

