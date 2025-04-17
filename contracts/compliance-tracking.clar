;; Compliance Tracking Contract
;; Ensures adherence to health and safety regulations

;; Data Variables
(define-map compliance-requirements
  { requirement-id: uint }
  {
    title: (string-utf8 100),
    description: (string-utf8 500),
    equipment-type: (string-utf8 50),
    frequency-days: uint,
    is-active: bool,
    created-by: principal
  }
)

(define-map compliance-records
  { record-id: uint }
  {
    equipment-id: uint,
    requirement-id: uint,
    inspection-date: uint,
    inspector: principal,
    notes: (string-utf8 500),
    passed: bool,
    next-due-date: uint
  }
)

(define-data-var next-requirement-id uint u1)
(define-data-var next-record-id uint u1)
(define-data-var admin-principal principal tx-sender)

;; Read-Only Functions
(define-read-only (get-compliance-requirement (requirement-id uint))
  (map-get? compliance-requirements { requirement-id: requirement-id })
)

(define-read-only (get-requirements-by-equipment-type (equipment-type (string-utf8 50)))
  ;; In Clarity, we can't directly filter maps like this
  ;; This is a simplified version that would need to be expanded in a real implementation
  ;; A production version would need to iterate through requirement IDs
  (ok "Function would return requirements for this equipment type")
)

(define-read-only (get-compliance-record (record-id uint))
  (map-get? compliance-records { record-id: record-id })
)

(define-read-only (get-equipment-compliance-history (equipment-id uint))
  ;; In Clarity, we can't directly filter maps like this
  ;; This is a simplified version that would need to be expanded in a real implementation
  ;; A production version would need to iterate through record IDs
  (ok "Function would return compliance history for this equipment ID")
)

(define-read-only (get-due-inspections (current-date uint))
  ;; In Clarity, we can't directly filter maps like this
  ;; This is a simplified version that would need to be expanded in a real implementation
  ;; A production version would need to iterate through record IDs
  (ok "Function would return inspections due by this date")
)

;; Private Functions
(define-private (is-admin)
  (is-eq tx-sender (var-get admin-principal))
)

;; Public Functions
(define-public (create-compliance-requirement
    (title (string-utf8 100))
    (description (string-utf8 500))
    (equipment-type (string-utf8 50))
    (frequency-days uint)
  )
  (let
    (
      (requirement-id (var-get next-requirement-id))
    )
    ;; Only admin can create requirements
    (asserts! (is-admin) (err u1))

    ;; Update the ID counter for next requirement
    (var-set next-requirement-id (+ requirement-id u1))

    ;; Create the compliance requirement
    (map-set compliance-requirements
      { requirement-id: requirement-id }
      {
        title: title,
        description: description,
        equipment-type: equipment-type,
        frequency-days: frequency-days,
        is-active: true,
        created-by: tx-sender
      }
    )

    ;; Return success with requirement ID
    (ok requirement-id)
  )
)

(define-public (record-compliance-inspection
    (equipment-id uint)
    (requirement-id uint)
    (inspection-date uint)
    (notes (string-utf8 500))
    (passed bool)
  )
  (let
    (
      (record-id (var-get next-record-id))
      (requirement-data (unwrap! (get-compliance-requirement requirement-id) (err u1)))
      (frequency-days (get frequency-days requirement-data))
      (next-due-date (+ inspection-date frequency-days))
    )
    ;; Update the ID counter for next record
    (var-set next-record-id (+ record-id u1))

    ;; Create compliance record
    (map-set compliance-records
      { record-id: record-id }
      {
        equipment-id: equipment-id,
        requirement-id: requirement-id,
        inspection-date: inspection-date,
        inspector: tx-sender,
        notes: notes,
        passed: passed,
        next-due-date: next-due-date
      }
    )

    ;; Return success with record ID
    (ok record-id)
  )
)

(define-public (update-requirement-status
    (requirement-id uint)
    (is-active bool)
  )
  (let
    (
      (requirement-data (unwrap! (get-compliance-requirement requirement-id) (err u1)))
    )
    ;; Only admin can update requirement status
    (asserts! (is-admin) (err u2))

    ;; Update the requirement status
    (map-set compliance-requirements
      { requirement-id: requirement-id }
      (merge requirement-data { is-active: is-active })
    )

    ;; Return success
    (ok true)
  )
)

(define-public (change-admin (new-admin principal))
  (begin
    ;; Only current admin can update admin
    (asserts! (is-admin) (err u1))

    ;; Update admin principal
    (var-set admin-principal new-admin)

    ;; Return success
    (ok true)
  )
)
