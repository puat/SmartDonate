export const SMART_DONATE_CONTRACT_ADDRESS = "0x3F616b47c0e5a8f465D13bDb42385b24f5B4A1D8";
export const CHAIN_ID = 31337;
export const NETWORK_NAME = "Ethereum Local Escrow (EVM #31337)";

export const SOLIDITY_SOURCE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartDonateEscrow
 * @author SmartDonate Decentralized Protocol
 * @notice Milestone-based Crowdfunding Escrow with Cryptographic Evidence Verification
 */
contract SmartDonateEscrow {
    enum MilestoneStatus {
        Pending,
        EvidenceSubmitted,
        Verified,
        Released,
        Rejected
    }

    struct Milestone {
        uint256 id;
        string title;
        uint256 percentage; // e.g. 30 = 30%
        uint256 releaseAmountWei;
        string evidenceCID;
        string evidenceHash; // SHA-256 / Keccak256
        string evidenceDescription;
        MilestoneStatus status;
        uint256 submittedAt;
        uint256 verifiedAt;
        uint256 releasedAt;
        address verifier;
        string auditNotes;
    }

    struct Campaign {
        uint256 id;
        address manager;
        address payable beneficiary;
        string title;
        string category;
        uint256 targetWei;
        uint256 totalDonatedWei;
        uint256 totalReleasedWei;
        uint256 totalRefundedWei;
        uint256 deadline;
        bool isFrozen;
        bool isCompleted;
        uint256 milestoneCount;
        uint256 currentMilestoneIndex;
        uint256 createdAt;
    }

    struct DonationRecord {
        address donor;
        uint256 amountWei;
        uint256 timestamp;
        string message;
        bool isAnonymous;
    }

    address public admin;
    uint256 public campaignCount;
    mapping(address => bool) public isAuthorizedVerifier;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(uint256 => Milestone)) public campaignMilestones;
    mapping(uint256 => DonationRecord[]) public campaignDonations;
    mapping(uint256 => mapping(address => uint256)) public donorContributions;

    event CampaignCreated(uint256 indexed campaignId, address indexed manager, address beneficiary, uint256 targetWei, string title);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amountWei, string message);
    event MilestoneEvidenceSubmitted(uint256 indexed campaignId, uint256 indexed milestoneId, string evidenceCID, string evidenceHash);
    event MilestoneVerified(uint256 indexed campaignId, uint256 indexed milestoneId, address indexed verifier, bool approved);
    event MilestoneFundsReleased(uint256 indexed campaignId, uint256 indexed milestoneId, address beneficiary, uint256 amountWei);
    event CampaignFrozen(uint256 indexed campaignId, string reason);
    event CampaignUnfrozen(uint256 indexed campaignId);
    event DonorsRefunded(uint256 indexed campaignId, uint256 totalRefundedWei);
    event VerifierUpdated(address indexed verifier, bool isAuthorized);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyManager(uint256 _campaignId) {
        require(msg.sender == campaigns[_campaignId].manager || msg.sender == admin, "Not campaign manager");
        _;
    }

    modifier onlyVerifier() {
        require(isAuthorizedVerifier[msg.sender] || msg.sender == admin, "Not an authorized verifier");
        _;
    }

    modifier notFrozen(uint256 _campaignId) {
        require(!campaigns[_campaignId].isFrozen, "Campaign is currently frozen");
        _;
    }

    constructor() {
        admin = msg.sender;
        isAuthorizedVerifier[msg.sender] = true;
    }

    function createCampaign(
        address payable _beneficiary,
        string memory _title,
        string memory _category,
        uint256 _targetWei,
        uint256 _deadline,
        string[] memory _milestoneTitles,
        uint256[] memory _milestonePercentages
    ) external returns (uint256) {
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_milestoneTitles.length == _milestonePercentages.length, "Milestone arrays mismatch");
        require(_milestoneTitles.length > 0, "At least one milestone required");

        uint256 totalPct = 0;
        for (uint256 i = 0; i < _milestonePercentages.length; i++) {
            totalPct += _milestonePercentages[i];
        }
        require(totalPct == 100, "Milestone percentages must sum to 100%");

        campaignCount++;
        uint256 newId = campaignCount;

        campaigns[newId] = Campaign({
            id: newId,
            manager: msg.sender,
            beneficiary: _beneficiary,
            title: _title,
            category: _category,
            targetWei: _targetWei,
            totalDonatedWei: 0,
            totalReleasedWei: 0,
            totalRefundedWei: 0,
            deadline: _deadline,
            isFrozen: false,
            isCompleted: false,
            milestoneCount: _milestoneTitles.length,
            currentMilestoneIndex: 0,
            createdAt: block.timestamp
        });

        for (uint256 j = 0; j < _milestoneTitles.length; j++) {
            uint256 releaseWei = (_targetWei * _milestonePercentages[j]) / 100;
            campaignMilestones[newId][j] = Milestone({
                id: j,
                title: _milestoneTitles[j],
                percentage: _milestonePercentages[j],
                releaseAmountWei: releaseWei,
                evidenceCID: "",
                evidenceHash: "",
                evidenceDescription: "",
                status: MilestoneStatus.Pending,
                submittedAt: 0,
                verifiedAt: 0,
                releasedAt: 0,
                verifier: address(0),
                auditNotes: ""
            });
        }

        emit CampaignCreated(newId, msg.sender, _beneficiary, _targetWei, _title);
        return newId;
    }

    function donate(uint256 _campaignId, string memory _message, bool _isAnonymous) external payable notFrozen(_campaignId) {
        require(msg.value > 0, "Donation must be greater than 0");
        Campaign storage c = campaigns[_campaignId];
        require(c.id != 0, "Campaign does not exist");
        require(block.timestamp <= c.deadline, "Campaign deadline has passed");

        c.totalDonatedWei += msg.value;
        donorContributions[_campaignId][msg.sender] += msg.value;

        campaignDonations[_campaignId].push(DonationRecord({
            donor: msg.sender,
            amountWei: msg.value,
            timestamp: block.timestamp,
            message: _message,
            isAnonymous: _isAnonymous
        }));

        emit DonationReceived(_campaignId, msg.sender, msg.value, _message);
    }

    function submitMilestoneEvidence(
        uint256 _campaignId,
        uint256 _milestoneId,
        string memory _evidenceCID,
        string memory _evidenceHash,
        string memory _evidenceDescription
    ) external onlyManager(_campaignId) notFrozen(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(_milestoneId < c.milestoneCount, "Milestone index out of bounds");
        Milestone storage m = campaignMilestones[_campaignId][_milestoneId];
        require(
            m.status == MilestoneStatus.Pending || m.status == MilestoneStatus.Rejected,
            "Milestone is not pending"
        );

        m.evidenceCID = _evidenceCID;
        m.evidenceHash = _evidenceHash;
        m.evidenceDescription = _evidenceDescription;
        m.status = MilestoneStatus.EvidenceSubmitted;
        m.submittedAt = block.timestamp;

        emit MilestoneEvidenceSubmitted(_campaignId, _milestoneId, _evidenceCID, _evidenceHash);
    }

    function verifyMilestone(
        uint256 _campaignId,
        uint256 _milestoneId,
        bool _approved,
        string memory _auditNotes
    ) external onlyVerifier notFrozen(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(_milestoneId < c.milestoneCount, "Milestone index out of bounds");
        Milestone storage m = campaignMilestones[_campaignId][_milestoneId];
        require(m.status == MilestoneStatus.EvidenceSubmitted, "Evidence not submitted");

        m.verifier = msg.sender;
        m.auditNotes = _auditNotes;
        m.verifiedAt = block.timestamp;

        if (_approved) {
            m.status = MilestoneStatus.Verified;
        } else {
            m.status = MilestoneStatus.Rejected;
        }

        emit MilestoneVerified(_campaignId, _milestoneId, msg.sender, _approved);
    }

    function releaseMilestoneFunds(uint256 _campaignId, uint256 _milestoneId) external notFrozen(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(_milestoneId < c.milestoneCount, "Milestone index out of bounds");
        Milestone storage m = campaignMilestones[_campaignId][_milestoneId];
        require(m.status == MilestoneStatus.Verified, "Milestone is not verified");

        uint256 payout = m.releaseAmountWei;
        uint256 escrowBalance = address(this).balance;
        if (payout > escrowBalance) {
            payout = escrowBalance;
        }
        require(payout > 0, "No funds available to release");

        m.status = MilestoneStatus.Released;
        m.releasedAt = block.timestamp;
        c.totalReleasedWei += payout;

        if (_milestoneId + 1 > c.currentMilestoneIndex) {
            c.currentMilestoneIndex = _milestoneId + 1;
        }

        if (c.currentMilestoneIndex >= c.milestoneCount) {
            c.isCompleted = true;
        }

        (bool success, ) = c.beneficiary.call{value: payout}("");
        require(success, "Transfer to beneficiary failed");

        emit MilestoneFundsReleased(_campaignId, _milestoneId, c.beneficiary, payout);
    }

    receive() external payable {}
}`;

export const SMART_DONATE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "manager", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "beneficiary", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "targetWei", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "title", "type": "string" }
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "donor", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amountWei", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "message", "type": "string" }
    ],
    "name": "DonationReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "evidenceCID", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "evidenceHash", "type": "string" }
    ],
    "name": "MilestoneEvidenceSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "verifier", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "MilestoneVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "beneficiary", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amountWei", "type": "uint256" }
    ],
    "name": "MilestoneFundsReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "reason", "type": "string" }
    ],
    "name": "CampaignFrozen",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address payable", "name": "_beneficiary", "type": "address" },
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_category", "type": "string" },
      { "internalType": "uint256", "name": "_targetWei", "type": "uint256" },
      { "internalType": "uint256", "name": "_deadline", "type": "uint256" },
      { "internalType": "string[]", "name": "_milestoneTitles", "type": "string[]" },
      { "internalType": "uint256[]", "name": "_milestonePercentages", "type": "uint256[]" }
    ],
    "name": "createCampaign",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_campaignId", "type": "uint256" },
      { "internalType": "string", "name": "_message", "type": "string" },
      { "internalType": "bool", "name": "_isAnonymous", "type": "bool" }
    ],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_campaignId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "string", "name": "_evidenceCID", "type": "string" },
      { "internalType": "string", "name": "_evidenceHash", "type": "string" },
      { "internalType": "string", "name": "_evidenceDescription", "type": "string" }
    ],
    "name": "submitMilestoneEvidence",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_campaignId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" },
      { "internalType": "bool", "name": "_approved", "type": "bool" },
      { "internalType": "string", "name": "_auditNotes", "type": "string" }
    ],
    "name": "verifyMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_campaignId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" }
    ],
    "name": "releaseMilestoneFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_campaignId", "type": "uint256" },
      { "internalType": "string", "name": "_reason", "type": "string" }
    ],
    "name": "freezeCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
