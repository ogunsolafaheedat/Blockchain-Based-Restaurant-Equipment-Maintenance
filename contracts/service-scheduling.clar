;; Service Scheduling Contract
;; Manages maintenance schedules and service records

;; Data Variables
(define-map maintenance-schedule
  { schedule-id: uint }
  {
    equipment-id: uint,
    service-type: (string-utf8 100),
    frequency-days: uint,
    last-service-date: uint,
    next-service-date: uint,
    created-by: principal
  }
)

(define-map service-records
  { record-id: uint }
  {
    equipment-id: uint,
    schedule-id: uint,
    service-date: uint,
    service-type: (string-utf8 100),
    technician: principal,
    notes: (string-utf8 500),
    status: (string-utf8 20) ;; "completed", "pending", "failed"
  }
)

(define-data-var next-schedule-id uint u1)
(define-data-var next-record-id uint u1)

;; Read-Only Functions
(define-read-only (get-maintenance-schedule (schedule-id uint))
  (map-get? maintenance-schedule { schedule-id: schedule-id })
)

(define-read-only (get-equipment-schedules (equipment-id uint))
  ;; In Clarity, we can't directly filter maps like this
  ;; This is a simplified version that would need to be expanded in a real implementation
  ;; A production version would need to iterate through schedule IDs
  (ok "Function would return schedules for this equipment ID")
)

(define-read-only (get-service-record (record-id uint))
  (map-get? service-records { record-id: record-id })
)

(define-read-only (get-equipment-service-history (equipment-id uint))
  ;; In Clarity, we can't directly filter maps like this
  ;; This is a simplified version that would need to be expanded in a real implementation
  ;; A production version would need to iterate through record IDs
  (ok "Function would return service history for this equipment ID")
)

(define-read-only (get-due-maintenance (current-date uint))
  ;; In Clarity, we can't directly filter maps like this
  ;; This is a simplified version that would need to be expanded in a real implementation
  ;; A production version would need to iterate through schedule IDs
  (ok "Function would return maintenance due by this date")
)

;; Public Functions
(define-public (create-maintenance-schedule
    (equipment-id uint)
    (service-type (string-utf8 100))
    (frequency-days uint)
    (initial-service-date uint)
  )
  (let
    (
      (schedule-id (var-get next-schedule-id))
      (next-date (+ initial-service-date frequency-days))
    )
    ;; Update the ID counter for next schedule
    (var-set next-schedule-id (+ schedule-id u1))

    ;; Create the maintenance schedule
    (map-set maintenance-schedule
      { schedule-id: schedule-id }
      {
        equipment-id: equipment-id,
        service-type: service-type,
        frequency-days: frequency-days,
        last-service-date: initial-service-date,
        next-service-date: next-date,
        created-by: tx-sender
      }
    )

    ;; Return success with schedule ID
    (ok schedule-id)
  )
)

(define-public (record-service
    (schedule-id uint)
    (service-date uint)
    (notes (string-utf8 500))
    (status (string-utf8 20))
  )
  (let
    (
      (record-id (var-get next-record-id))
      (schedule-data (unwrap! (get-maintenance-schedule schedule-id) (err u1)))
      (equipment-id (get equipment-id schedule-data))
      (service-type (get service-type schedule-data))
      (frequency-days (get frequency-days schedule-data))
      (next-date (+ service-date frequency-days))
    )
    ;; Update the ID counter for next record
    (var-set next-record-id (+ record-id u1))

    ;; Create service record
    (map-set service-records
      { record-id: record-id }
      {
        equipment-id: equipment-id,
        schedule-id: schedule-id,
        service-date: service-date,
        service-type: service-type,
        technician: tx-sender,
        notes: notes,
        status: status
      }
    )

    ;; Update the maintenance schedule with new dates
    (map-set maintenance-schedule
      { schedule-id: schedule-id }
      (merge schedule-data {
        last-service-date: service-date,
        next-service-date: next-date
      })
    )

    ;; Return success with record ID
    (ok record-id)
  )
)

(define-public (update-schedule-frequency
    (schedule-id uint)
    (new-frequency-days uint)
  )
  (let
    (
      (schedule-data (unwrap! (get-maintenance-schedule schedule-id) (err u1)))
      (created-by (get created-by schedule-data))
      (last-service-date (get last-service-date schedule-data))
      (next-date (+ last-service-date new-frequency-days))
    )
    ;; Check that sender is the creator of the schedule
    (asserts! (is-eq tx-sender created-by) (err u2))

    ;; Update the maintenance schedule with new frequency
    (map-set maintenance-schedule
      { schedule-id: schedule-id }
      (merge schedule-data {
        frequency-days: new-frequency-days,
        next-service-date: next-date
      })
    )

    ;; Return success
    (ok true)
  )
)
