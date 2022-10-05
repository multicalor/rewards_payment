// SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// Условия: 
// + 1. Вознаграждения перечисляются в виде ERC20 и ERC721 токенов. 
// + 2. Каждый этап выплаты вознаграждений ограничен количеством выплачиваемых токенов (общая сумма ERC20 токенов или количество ERC721 токенов)
// + 3. В каждом этапе может быть выплата до 5 разных ЕRC20 токенов (например, USDT и WBNB) и 1 ERC721
// + 4. Начисление вознаграждения привязывается к конкретному адресу
// + 5. Вознаграждение выплачивается транзакцией пользователя на контракт (комиссию платит пользователь)
// + 6. Награждение выплачивается через трансфер токенов c баланса контракта на адрес получателя
// + 7. Владелец контракта может в любой момент остановить выплату вознаграждений
// + 8. Владелец контракта может инициировать новые этапы вознаграждений с отдельными лимитами по количеству выплачиваемых токенов
// + 9. Вознаграждение может получить только тот адрес для которого был сгенерирован код

// WorkFlow:
// + Входящие данные: список кошельков и сумма начисленной награды на каждый кошелек.

// + 1. Владелец смарт контракта инициирует новый этап вознаграждений с указанием общей суммы выплаты по токенам

// +/- 2. На стороне сервера при запросе на каждый адрес генерируется подпись и передается пользователю по открытому каналу

// +/- 3. Пользователь, получив подпись, может провести транзакцию в смарт контракт и получить начисленное ему вознаграждение

// Необходимо: 
// + 1. Разработать смарт-контракт выплаты вознаграждений
// 2. Разработать скрипт генерации кодов для пользователей на nodeJS (на вход получаем адрес кошелька пользователя, адрес токена и сумму (или количество для ЕRC721) на выходе подпись для транзакции)
// Бонусом:
// + 1. Разработать скрипт деплоя смарт-контракта в тестовую сеть
// +/- 2. Разработать тесты основного функционала смарт-контракта в связке со скриптом генерации кодов для выплаты
//  Мы делаем подпись на сервере, и позволяем пользователю самому сделать себе выплату с контракта, и следовательно пользователь сам заплатит за это действие.

// Нет необходимости хранить данные кто и сколько в каком раунде получает так как теряется смысл проверки подписи.
// В таком случае мы можем просто передать в контракт список получателей, токены и суммы какие хотим раздать.
// Идея контракта - обработать очень большое число получателей - которое мы физически не можем записать на контракт так как это очень дорого по стоимости транзакции.
// На контракте храним только список токенов которые раздаем в раунде и общую сумму по каждому токену , а так же отслеживаем сколько в каждом раунде уже сняли.

// При выплате вознаграждения, на контракт должны передать номер раунда, токены, суммы и подпись, сформированную всеми этим данными. 
// На контракте мы должны проверить что подпись сгенерирована именно с этих данных и подписана нашим сервером.
// В текущей реализации теряется смысл подписи и ее проверки на контракте так как можно с одной подписью получать вознаграждение каждый раз когда получатель появляется в мапинге recipientsRewards

contract Rewarder is Ownable{

    using SafeERC20 for IERC20;

    IERC721 NFT;

    enum PaymentStatuses {Active, Paused}

    PaymentStatuses paymentStatus;

    address signer;

    constructor(address nftAddress){
        NFT = IERC721(nftAddress);
        paymentStatus = PaymentStatuses.Active;
        signer = owner();
    }
    
    struct RewardReceipt{
        address recipient;
        Token[] tokens;
        uint [] nftIds;
        uint256 roundId;
    }

    struct Token {
        address tokenAddress;
        uint amount;
    }

    mapping(bytes32 => bool) public executed;
    mapping(uint => mapping(address => uint)) public rewardsTokensAmount;
    mapping(uint => uint) public amountNftRound;   
    mapping(uint => address[]) public recipients; // в принципе можно без него, так как он хешируется в RewardReceipt
    uint rewardRoundId;

    event WithdrawReward(RewardReceipt reward);

    modifier checkPaymentStatus(){
        require(paymentStatus == PaymentStatuses.Active, 'Rewarder: Payment status is paused');
        _;
    }

    function createRewards(
        address [] memory _recipients,
        bytes32 [] memory _msgHash,
        Token [] calldata _tokens, 
        uint _amountNft
        ) external{
        require(_tokens.length <= 5, "Rewarder: Only five tokens types");
        for(uint i = 0; i < _tokens.length; i++) {
            rewardsTokensAmount[rewardRoundId][_tokens[i].tokenAddress] = _tokens[i].amount;
        }
        amountNftRound[rewardRoundId] = _amountNft;
        for(uint i = 0; i <_recipients.length; i++){
            recipients[i].push(_recipients[i]);
            executed[_msgHash[i]] = true;
        }
        
        rewardRoundId++;
    }
    
    function getRewards(
        uint8 _v,
        bytes32 _r,
        bytes32 _s,
        bytes32 _UUID,
        RewardReceipt calldata _rewardReceipt
    ) external checkPaymentStatus{
        require(paymentStatus == PaymentStatuses.Active, "Rewarder: Reward is paused");
        bytes32 msgHash = keccak256(abi.encode(msg.sender, _UUID, _rewardReceipt)); 
        require(executed[msgHash], "Rewarder: Has been executed!"); 
        executed[msgHash] = false; 
        address _signer = verifyHash(msgHash, _v, _r, _s);
        require(_signer == signer, "Rewarder: signer not recovered from signed tx!");
        uint roundId = _rewardReceipt.roundId;
        for(uint8 i = 0; i < _rewardReceipt.tokens.length; i++) {
            // Переменные созданы для урощения понимания, в боевом контракте сделал бы без них
            address tokenAddress =_rewardReceipt.tokens[i].tokenAddress;
            uint amount = _rewardReceipt.tokens[i].amount;
            uint roundTokenBalance = rewardsTokensAmount[roundId][tokenAddress];
            uint contractBalance = IERC20(tokenAddress).balanceOf(address(this));
            require(roundTokenBalance >= amount || contractBalance >= amount, "Rewarder: Wrong reward balance");
            IERC20(tokenAddress).safeTransfer(msg.sender, amount);
            rewardsTokensAmount[roundId][tokenAddress] = roundTokenBalance - amount;
        }
        for(uint8 i = 0; i < _rewardReceipt.nftIds.length; i++) {
            uint nftId = _rewardReceipt.nftIds[i];
            require(NFT.ownerOf(nftId) == address(this), "Rewarder: Wrong nftId");
            require( amountNftRound[roundId] > 0 && NFT.balanceOf(address(this)) > 0, "Rewarder: No nft on contract");
            
            NFT.safeTransferFrom(address(this), msg.sender, nftId);
            amountNftRound[roundId]--;
        }
        emit WithdrawReward(_rewardReceipt);
    }

    function changePaymentStatus(PaymentStatuses _status) external onlyOwner{
        paymentStatus = _status;
    }

    function verifyHash(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal pure
        returns (address signer) {

        bytes32 messageDigest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));//(...));

        return ecrecover(messageDigest, _v, _r, _s);
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
