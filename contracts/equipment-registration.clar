;; Equipment Registration Contract
;; Stores and manages restaurant equipment information

;; Data Variables
(define-map equipment-registry
  { equipment-id: uint }
  {
    name: (string-utf8 100),
    equipment-type: (string-utf8 50),
    manufacturer: (string-utf8 100),
    model: (string-utf8 100),
    serial-number: (string-utf8 100),
    installation-date: uint,
    warranty-expiration: uint,
    owner: principal
  }
)

(define-data-var next-equipment-id uint u1)

;; Read-Only Functions
(define-read-only (get-equipment (equipment-id uint))
  (map-get? equipment-registry { equipment-id: equipment-id })
)

(define-read-only (get-equipment-by-owner (owner principal))
  ;; In Clarity, we can't directly filter maps like this
  ;; This is a simplified version that would need to be expanded in a real implementation
  ;; A production version would need to iterate through equipment IDs
  (ok "Function would return equipment owned by this principal")
)

;; Public Functions
(define-public (register-equipment
    (name (string-utf8 100))
    (equipment-type (string-utf8 50))
    (manufacturer (string-utf8 100))
    (model (string-utf8 100))
    (serial-number (string-utf8 100))
    (installation-date uint)
    (warranty-expiration uint)
  )
  (let
    (
      (equipment-id (var-get next-equipment-id))
      (owner tx-sender)
    )
    ;; Update the ID counter for next registration
    (var-set next-equipment-id (+ equipment-id u1))

    ;; Insert the equipment into our registry
    (map-set equipment-registry
      { equipment-id: equipment-id }
      {
        name: name,
        equipment-type: equipment-type,
        manufacturer: manufacturer,
        model: model,
        serial-number: serial-number,
        installation-date: installation-date,
        warranty-expiration: warranty-expiration,
        owner: owner
      }
    )

    ;; Return success with equipment ID
    (ok equipment-id)
  )
)

(define-public (update-equipment
    (equipment-id uint)
    (name (string-utf8 100))
    (equipment-type (string-utf8 50))
    (manufacturer (string-utf8 100))
    (model (string-utf8 100))
    (serial-number (string-utf8 100))
    (installation-date uint)
    (warranty-expiration uint)
  )
  (let
    (
      (equipment-data (unwrap! (get-equipment equipment-id) (err u1)))
      (owner (get owner equipment-data))
    )
    ;; Check that sender is the owner
    (asserts! (is-eq tx-sender owner) (err u2))

    ;; Update the equipment data
    (map-set equipment-registry
      { equipment-id: equipment-id }
      {
        name: name,
        equipment-type: equipment-type,
        manufacturer: manufacturer,
        model: model,
        serial-number: serial-number,
        installation-date: installation-date,
        warranty-expiration: warranty-expiration,
        owner: owner
      }
    )

    ;; Return success
    (ok true)
  )
)

(define-public (transfer-ownership
    (equipment-id uint)
    (new-owner principal)
  )
  (let
    (
      (equipment-data (unwrap! (get-equipment equipment-id) (err u1)))
      (current-owner (get owner equipment-data))
    )
    ;; Check that sender is the current owner
    (asserts! (is-eq tx-sender current-owner) (err u2))

    ;; Update the equipment data with new owner
    (map-set equipment-registry
      { equipment-id: equipment-id }
      (merge equipment-data { owner: new-owner })
    )

    ;; Return success
    (ok true)
  )
)
