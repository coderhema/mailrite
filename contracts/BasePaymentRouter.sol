// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BasePaymentRouter {
    struct Route {
        address recipient;
        uint16 basisPoints;
        bool enabled;
    }

    address public owner;
    uint16 public constant MAX_BASIS_POINTS = 10_000;

    mapping(bytes32 => Route) public routes;
    mapping(bytes32 => bool) public processedSendIds;
    mapping(address => uint256) public collected;

    event RouteConfigured(bytes32 indexed routeKey, address indexed recipient, uint16 basisPoints, bool enabled);
    event PaymentRouted(
        bytes32 indexed routeKey,
        bytes32 indexed sendId,
        address indexed payer,
        address recipient,
        uint256 amount,
        uint256 recipientShare,
        uint256 platformShare
    );
    event Withdrawn(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, 'only owner');
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function configureRoute(
        bytes32 routeKey,
        address recipient,
        uint16 basisPoints,
        bool enabled
    ) external onlyOwner {
        require(recipient != address(0), 'recipient required');
        require(basisPoints <= MAX_BASIS_POINTS, 'invalid basis points');
        routes[routeKey] = Route({ recipient: recipient, basisPoints: basisPoints, enabled: enabled });
        emit RouteConfigured(routeKey, recipient, basisPoints, enabled);
    }

    function quote(
        bytes32 routeKey,
        uint256 amount
    ) public view returns (uint256 recipientShare, uint256 platformShare) {
        Route memory route = routes[routeKey];
        require(route.enabled, 'route disabled');
        recipientShare = (amount * route.basisPoints) / MAX_BASIS_POINTS;
        platformShare = amount - recipientShare;
    }

    function payAndRoute(
        bytes32 routeKey,
        bytes32 sendId
    ) external payable returns (uint256 recipientShare, uint256 platformShare) {
        require(!processedSendIds[sendId], 'send already processed');
        processedSendIds[sendId] = true;

        Route memory route = routes[routeKey];
        require(route.enabled, 'route disabled');
        require(route.recipient != address(0), 'route missing');
        require(msg.value > 0, 'payment required');

        recipientShare = (msg.value * route.basisPoints) / MAX_BASIS_POINTS;
        platformShare = msg.value - recipientShare;

        collected[route.recipient] += recipientShare;
        collected[owner] += platformShare;

        (bool routedRecipient, ) = payable(route.recipient).call{ value: recipientShare }('');
        require(routedRecipient, 'recipient transfer failed');

        if (platformShare > 0) {
            (bool routedPlatform, ) = payable(owner).call{ value: platformShare }('');
            require(routedPlatform, 'platform transfer failed');
        }

        emit PaymentRouted(routeKey, sendId, msg.sender, route.recipient, msg.value, recipientShare, platformShare);
    }

    function withdraw(address payable recipient) external onlyOwner {
        require(recipient != address(0), 'recipient required');
        uint256 amount = address(this).balance;
        require(amount > 0, 'nothing to withdraw');
        (bool sent, ) = recipient.call{ value: amount }('');
        require(sent, 'withdraw failed');
        emit Withdrawn(recipient, amount);
    }
}
