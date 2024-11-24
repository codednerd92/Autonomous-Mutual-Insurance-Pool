# Decentralized Autonomous Mutual Insurance Pool

This project implements a decentralized mutual insurance system using Clarity smart contracts on the Stacks blockchain. The platform allows participants to pool resources, create insurance policies, submit claims, and process payouts in a transparent and autonomous manner.

## Features

1. Participant Management
    - Users can join the insurance pool
    - Only participants can create policies

2. Policy Creation
    - Participants can create insurance policies
    - Policies have coverage amounts, premiums, and durations

3. Claim Submission
    - Policy owners can submit claims
    - Claims are associated with specific policies

4. Claim Approval
    - Contract owner can approve claims
    - Approved claims are paid out from the pool balance

5. Pool Balance Management
    - Pool balance increases with premium payments
    - Pool balance decreases with claim payouts

## Smart Contract Functions

### Participant Management
- `join-pool`: Allows a user to join the insurance pool

### Policy Management
- `create-policy`: Creates a new insurance policy for a participant
- `get-policy`: Retrieves information about a specific policy

### Claim Management
- `submit-claim`: Submits a new claim for a policy
- `approve-claim`: Approves a submitted claim (contract owner only)
- `get-claim`: Retrieves information about a specific claim

### Pool Management
- `get-pool-balance`: Retrieves the current balance of the insurance pool

## Testing

The project includes a comprehensive test suite using Vitest. The tests cover various scenarios including:

- Joining the pool
- Creating policies
- Submitting claims
- Approving claims
- Error handling for unauthorized actions and insufficient funds

To run the tests, use the following command:

```bash
npx vitest

