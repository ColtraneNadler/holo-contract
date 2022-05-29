// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Counters.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol";
import "https://github.com/chiru-labs/ERC721A/blob/main/contracts/ERC721A.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/ECDSA.sol";

contract XERC721 {
    uint256 public CIRCULATING_SUPPLY;
    function totalSupply() public view returns (uint) {}
    function balanceOf(address) public view returns (uint) {}
    function ownerOf(uint) public view returns (address) {}
}

contract HoloNFT is ERC721A, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    XERC721 public xoid; 
    address signerAddress;
    string uri;
    uint price;
    bool publicMint = false;

    uint MAX_TOTAL_SUPPLY = 33333;
    uint CAP_SUPPLY = 8888;

    mapping(uint => int) redeemed_xoids;
    mapping(address => int) redeemed_frens;

    constructor(address _xoid, address vaultAddress) ERC721A("meka_key_001", "mkey001") {
        xoid = XERC721(_xoid);

        _mint(vaultAddress, 444);
    }

    function setCapSupply(uint _capSupply) external onlyOwner {
        require(_capSupply <= MAX_TOTAL_SUPPLY, "Cannot be more than the MAX_TOTAL_SUPPLY");
        CAP_SUPPLY = _capSupply;
    }

    function setSignerAddress(address _address) external onlyOwner {
        signerAddress = _address;
    }

    function setUri(string memory _uri) external onlyOwner {
        uri = _uri;
    }

    function _validSignature(bytes memory signature, bytes32 msgHash) internal view returns (bool) {
        return ECDSA.recover(msgHash, signature) == signerAddress;
    }

    function setPrice(uint _price) external onlyOwner {
        price = _price;
    }
    
    function setPublic(bool _bool) external onlyOwner {
        publicMint = _bool;
    }

    /**
     * Filter out tokens that have already been redeemed
     */
    function filterRedeemableTokens(address receiver, uint[] memory tokenIds) public view returns (uint[] memory, uint) {
        uint total;

        // get total redeemable
        for(uint j = 0; j < tokenIds.length; j++) 
            if(!isRedeemed(tokenIds[j]) && xoid.ownerOf(tokenIds[j]) == receiver)
                total+=1;
        
        uint[] memory tokens = new uint[](total);
        total = 0;
        for(uint j = 0; j < tokenIds.length; j++) 
            if(!isRedeemed(tokenIds[j]) && xoid.ownerOf(tokenIds[j]) == receiver) {
                tokens[total] = tokenIds[j];
                total+=1;
            }

        return (tokens, total);
    }

    // Check to see if xoid token has been redeemed already
    function isRedeemed(uint _tokenId) public view returns (bool) {
        return redeemed_xoids[_tokenId] == 1;
    }

    function mint(address receiver, uint quantity) external payable {
        require(publicMint, "Mint is not public!");
        require(_totalMinted() < CAP_SUPPLY - 4444, "Sold out.");
        if(quantity > 5) quantity = 5;
        require(msg.value >= quantity * price, "You did not pay enough");
        _mint(receiver, quantity);
    }

    function xoidMint(address receiver, uint[] memory ownedTokens) external {
        require(_totalMinted() < CAP_SUPPLY, "Sold out.");
        // filter out tokens that have already been redeemed
        (uint[] memory redeemableXoids, uint totalTokens) = filterRedeemableTokens(receiver, ownedTokens);
        for(uint j = 0; j < redeemableXoids.length; j++) redeemableXoids[j] = 1;

        _mint(receiver, totalTokens);
    }

    function frenMint(
        address receiver,
        bytes memory signature
    ) external {
        require(redeemed_frens[receiver] == 0, "You already received an NFT!");
        require(_totalMinted() < CAP_SUPPLY - 4444, "Sold out.");
        bytes32 msgHash = keccak256(
            abi.encode(receiver)
        );
        require(_validSignature(signature, msgHash), "INVALID_SIGNATURE");

        redeemed_frens[receiver] = 1;
        _mint(receiver, 1);
    }

    function getSigner(address receiver, bytes memory signature) external view returns(address) {
        bytes32 msgHash = keccak256(
            abi.encode(receiver)
        );
        return ECDSA.recover(msgHash, signature);
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return uri;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory baseURI) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        baseURI = _baseURI();
    }
}
