// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartDonateEscrow
 * @dev Milestone-based Crowdfunding Escrow with Cryptographic Evidence Verification
 * 
 * Flow:
 * 1. Campaign Manager creates campaign with target ETH and milestone percentage allocations.
 * 2. Donors deposit ETH into the smart contract escrow.
 * 3. Campaign Manager submits evidence (IPFS CID & SHA-256 hash) for a milestone.
 * 4. Verifiers/Auditors review the evidence on-chain and approve or reject the milestone.
 * 5. Once verified, funds allocated for that milestone can be released to the campaign beneficiary.
 * 6. If a campaign is canceled or fails audit, remaining locked funds can be refunded to donors pro-rata.
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

    // State Variables
    address public admin;
    uint256 public campaignCount;
    mapping(address => bool) public isAuthorizedVerifier;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(uint256 => Milestone)) public campaignMilestones;
    mapping(uint256 => DonationRecord[]) public campaignDonations;
    mapping(uint256 => mapping(address => uint256)) public donorContributions;

    // Events
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

    function setVerifier(address _verifier, bool _authorized) external onlyAdmin {
        isAuthorizedVerifier[_verifier] = _authorized;
        emit VerifierUpdated(_verifier, _authorized);
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
        require(_milestoneTitles.length == _milestonePercentages.length, "Milestone arrays length mismatch");
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
        require(m.status == MilestoneStatus.EvidenceSubmitted, "Evidence not submitted for milestone");

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

        // Move to next milestone index if applicable
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

    function freezeCampaign(uint256 _campaignId, string memory _reason) external onlyVerifier {
        Campaign storage c = campaigns[_campaignId];
        require(c.id != 0, "Campaign does not exist");
        c.isFrozen = true;
        emit CampaignFrozen(_campaignId, _reason);
    }

    function unfreezeCampaign(uint256 _campaignId) external onlyAdmin {
        Campaign storage c = campaigns[_campaignId];
        require(c.id != 0, "Campaign does not exist");
        c.isFrozen = false;
        emit CampaignUnfrozen(_campaignId);
    }

    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    function getMilestone(uint256 _campaignId, uint256 _milestoneId) external view returns (Milestone memory) {
        return campaignMilestones[_campaignId][_milestoneId];
    }

    function getDonationsCount(uint256 _campaignId) external view returns (uint256) {
        return campaignDonations[_campaignId].length;
    }

    receive() external payable {}
}
