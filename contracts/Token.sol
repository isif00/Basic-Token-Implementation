// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";


contract Token {
    string public name = "isifoo";
    string public symbol = "ISI";

    uint256 public totalSupply = 1000;

    address public ownerAdress;

    mapping (address => uint256) balances;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        balances[msg.sender] = totalSupply;
        ownerAdress = msg.sender;
    }

    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough tokens");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
        
    }

    function balanceOf(address account) external view returns (uint256){
        return balances[account];
    }

}