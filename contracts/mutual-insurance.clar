;; Decentralized Autonomous Mutual Insurance Pool

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-already-exists (err u103))
(define-constant err-insufficient-funds (err u104))
(define-constant err-invalid-policy (err u105))

;; Data variables
(define-data-var pool-balance uint u0)
(define-data-var next-policy-id uint u0)
(define-data-var next-claim-id uint u0)

;; Data maps
(define-map participants principal bool)

(define-map policies
  { policy-id: uint }
  {
    owner: principal,
    coverage-amount: uint,
    premium: uint,
    start-block: uint,
    end-block: uint,
    is-active: bool
  }
)

(define-map claims
  { claim-id: uint }
  {
    policy-id: uint,
    amount: uint,
    description: (string-utf8 500),
    is-approved: bool
  }
)

;; Private functions
(define-private (is-participant (address principal))
  (default-to false (map-get? participants address))
)

(define-private (is-owner)
  (is-eq tx-sender contract-owner)
)

;; Public functions
(define-public (join-pool)
  (begin
    (asserts! (not (is-participant tx-sender)) (err err-already-exists))
    (map-set participants tx-sender true)
    (ok true)
  )
)

(define-public (create-policy (coverage-amount uint) (premium uint) (duration uint))
  (let
    (
      (policy-id (var-get next-policy-id))
      (start-block block-height)
      (end-block (+ block-height duration))
    )
    (asserts! (is-participant tx-sender) (err err-unauthorized))
    (asserts! (>= (stx-get-balance tx-sender) premium) (err err-insufficient-funds))
    (match (stx-transfer? premium tx-sender (as-contract tx-sender))
      success
        (begin
          (var-set pool-balance (+ (var-get pool-balance) premium))
          (map-set policies
            { policy-id: policy-id }
            {
              owner: tx-sender,
              coverage-amount: coverage-amount,
              premium: premium,
              start-block: start-block,
              end-block: end-block,
              is-active: true
            }
          )
          (var-set next-policy-id (+ policy-id u1))
          (ok policy-id)
        )
      error (err err-insufficient-funds)
    )
  )
)

