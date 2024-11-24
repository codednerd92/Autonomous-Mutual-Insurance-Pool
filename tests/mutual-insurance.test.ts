import { describe, it, expect, beforeEach } from 'vitest';

// Mock contract state
let poolBalance = 0;
let nextPolicyId = 0;
let nextClaimId = 0;
let participants: { [key: string]: boolean } = {};
let policies: { [key: number]: any } = {};
let claims: { [key: number]: any } = {};

// Mock contract owner
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

// Helper function to reset state before each test
function resetState() {
  poolBalance = 0;
  nextPolicyId = 0;
  nextClaimId = 0;
  participants = {};
  policies = {};
  claims = {};
}

// Mock contract functions
function joinPool(sender: string): { type: string, value: boolean } {
  if (participants[sender]) {
    return { type: 'err', value: false };
  }
  participants[sender] = true;
  return { type: 'ok', value: true };
}

function createPolicy(sender: string, coverageAmount: number, premium: number, duration: number): { type: string, value: number | string } {
  if (!participants[sender]) {
    return { type: 'err', value: 'err-unauthorized' };
  }
  if (premium > 1000000) { // Mocking STX balance check
    return { type: 'err', value: 'err-insufficient-funds' };
  }
  const policyId = nextPolicyId++;
  policies[policyId] = {
    owner: sender,
    coverageAmount,
    premium,
    startBlock: 0, // Mocking block height
    endBlock: duration,
    isActive: true
  };
  poolBalance += premium;
  return { type: 'ok', value: policyId };
}

function submitClaim(sender: string, policyId: number, amount: number, description: string): { type: string, value: number | string } {
  const policy = policies[policyId];
  if (!policy || policy.owner !== sender) {
    return { type: 'err', value: 'err-unauthorized' };
  }
  if (!policy.isActive || amount > policy.coverageAmount) {
    return { type: 'err', value: 'err-invalid-policy' };
  }
  const claimId = nextClaimId++;
  claims[claimId] = { policyId, amount, description, isApproved: false };
  return { type: 'ok', value: claimId };
}

function approveClaim(sender: string, claimId: number): { type: string, value: boolean | string } {
  if (sender !== contractOwner) {
    return { type: 'err', value: 'err-owner-only' };
  }
  const claim = claims[claimId];
  if (!claim) {
    return { type: 'err', value: 'err-not-found' };
  }
  if (claim.isApproved) {
    return { type: 'err', value: 'err-already-exists' };
  }
  if (claim.amount > poolBalance) {
    return { type: 'err', value: 'err-insufficient-funds' };
  }
  poolBalance -= claim.amount;
  claims[claimId].isApproved = true;
  return { type: 'ok', value: true };
}

describe('Mutual Insurance Contract', () => {
  beforeEach(() => {
    resetState();
  });
  
  it('allows users to join the pool', () => {
    const result = joinPool('user1');
    expect(result).toEqual({ type: 'ok', value: true });
    expect(participants['user1']).toBe(true);
  });
  
  it('prevents users from joining the pool twice', () => {
    joinPool('user1');
    const result = joinPool('user1');
    expect(result).toEqual({ type: 'err', value: false });
  });
  
  it('allows participants to create policies', () => {
    joinPool('user1');
    const result = createPolicy('user1', 1000000, 50000, 144);
    expect(result).toEqual({ type: 'ok', value: 0 });
    expect(policies[0]).toBeDefined();
    expect(poolBalance).toBe(50000);
  });
  
  it('prevents non-participants from creating policies', () => {
    const result = createPolicy('user1', 1000000, 50000, 144);
    expect(result).toEqual({ type: 'err', value: 'err-unauthorized' });
  });
  
  it('allows policy owners to submit claims', () => {
    joinPool('user1');
    createPolicy('user1', 1000000, 50000, 144);
    const result = submitClaim('user1', 0, 500000, 'Car accident');
    expect(result).toEqual({ type: 'ok', value: 0 });
    expect(claims[0]).toBeDefined();
  });
  
  it('prevents non-owners from submitting claims', () => {
    joinPool('user1');
    joinPool('user2');
    createPolicy('user1', 1000000, 50000, 144);
    const result = submitClaim('user2', 0, 500000, 'Car accident');
    expect(result).toEqual({ type: 'err', value: 'err-unauthorized' });
  });
  
  it('allows the contract owner to approve claims', () => {
    joinPool('user1');
    createPolicy('user1', 1000000, 50000, 144);
    submitClaim('user1', 0, 30000, 'Minor damage');
    const result = approveClaim(contractOwner, 0);
    expect(result).toEqual({ type: 'ok', value: true });
    expect(claims[0].isApproved).toBe(true);
    expect(poolBalance).toBe(20000);
  });
  
  it('prevents non-owners from approving claims', () => {
    joinPool('user1');
    createPolicy('user1', 1000000, 50000, 144);
    submitClaim('user1', 0, 30000, 'Minor damage');
    const result = approveClaim('user1', 0);
    expect(result).toEqual({ type: 'err', value: 'err-owner-only' });
  });
  
  it('prevents approving claims with insufficient pool balance', () => {
    joinPool('user1');
    createPolicy('user1', 1000000, 50000, 144);
    submitClaim('user1', 0, 60000, 'Major damage');
    const result = approveClaim(contractOwner, 0);
    expect(result).toEqual({ type: 'err', value: 'err-insufficient-funds' });
  });
});

