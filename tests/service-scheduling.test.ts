import { describe, it, expect, beforeEach } from "vitest"

// Mock blockchain environment
const mockBlockchain = {
  contracts: {
    "service-scheduling": {
      state: {
        "next-schedule-id": 1,
        "next-record-id": 1,
        "maintenance-schedule": new Map(),
        "service-records": new Map(),
      },
      functions: {
        "create-maintenance-schedule": (equipmentId, serviceType, frequencyDays, initialServiceDate) => {
          const scheduleId = mockBlockchain.contracts["service-scheduling"].state["next-schedule-id"]
          mockBlockchain.contracts["service-scheduling"].state["next-schedule-id"] += 1
          
          mockBlockchain.contracts["service-scheduling"].state["maintenance-schedule"].set(scheduleId, {
            "equipment-id": equipmentId,
            "service-type": serviceType,
            "frequency-days": frequencyDays,
            "last-service-date": initialServiceDate,
            "next-service-date": initialServiceDate + frequencyDays,
            "created-by": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // mock tx-sender
          })
          
          return { result: { value: scheduleId }, type: "ok" }
        },
        "get-maintenance-schedule": (scheduleId) => {
          const schedule = mockBlockchain.contracts["service-scheduling"].state["maintenance-schedule"].get(scheduleId)
          return { result: { value: schedule }, type: schedule ? "ok" : "none" }
        },
        "record-service": (scheduleId, serviceDate, notes, status) => {
          const recordId = mockBlockchain.contracts["service-scheduling"].state["next-record-id"]
          const schedule = mockBlockchain.contracts["service-scheduling"].state["maintenance-schedule"].get(scheduleId)
          
          if (!schedule) {
            return { result: { value: 1 }, type: "err" }
          }
          
          mockBlockchain.contracts["service-scheduling"].state["next-record-id"] += 1
          
          // Update schedule
          schedule["last-service-date"] = serviceDate
          schedule["next-service-date"] = serviceDate + schedule["frequency-days"]
          mockBlockchain.contracts["service-scheduling"].state["maintenance-schedule"].set(scheduleId, schedule)
          
          // Create service record
          mockBlockchain.contracts["service-scheduling"].state["service-records"].set(recordId, {
            "equipment-id": schedule["equipment-id"],
            "schedule-id": scheduleId,
            "service-date": serviceDate,
            "service-type": schedule["service-type"],
            technician: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // mock tx-sender
            notes: notes,
            status: status,
          })
          
          return { result: { value: recordId }, type: "ok" }
        },
        "get-service-record": (recordId) => {
          const record = mockBlockchain.contracts["service-scheduling"].state["service-records"].get(recordId)
          return { result: { value: record }, type: record ? "ok" : "none" }
        },
      },
    },
  },
}

describe("Service Scheduling Contract", () => {
  beforeEach(() => {
    // Reset the state before each test
    mockBlockchain.contracts["service-scheduling"].state["next-schedule-id"] = 1
    mockBlockchain.contracts["service-scheduling"].state["next-record-id"] = 1
    mockBlockchain.contracts["service-scheduling"].state["maintenance-schedule"] = new Map()
    mockBlockchain.contracts["service-scheduling"].state["service-records"] = new Map()
  })
  
  it("should create a maintenance schedule with valid data", () => {
    const result = mockBlockchain.contracts["service-scheduling"].functions["create-maintenance-schedule"](
        1, // equipment ID
        "Monthly Cleaning",
        30, // frequency in days
        1672531200, // Jan 1, 2023
    )
    
    expect(result.type).toBe("ok")
    expect(result.result.value).toBe(1)
    
    // Check that schedule was properly stored
    const storedSchedule = mockBlockchain.contracts["service-scheduling"].functions["get-maintenance-schedule"](1)
    expect(storedSchedule.type).toBe("ok")
    expect(storedSchedule.result.value["service-type"]).toBe("Monthly Cleaning")
    expect(storedSchedule.result.value["frequency-days"]).toBe(30)
    expect(storedSchedule.result.value["next-service-date"]).toBe(1672531200 + 30)
  })
  
  it("should record service and update next service date", () => {
    // First create a schedule
    mockBlockchain.contracts["service-scheduling"].functions["create-maintenance-schedule"](
        1, // equipment ID
        "Monthly Cleaning",
        30, // frequency in days
        1672531200, // Jan 1, 2023
    )
    
    // Now record a service
    const serviceDate = 1675209600 // Feb 1, 2023
    const result = mockBlockchain.contracts["service-scheduling"].functions["record-service"](
        1, // schedule ID
        serviceDate,
        "Cleaned all filters and surfaces",
        "completed",
    )
    
    expect(result.type).toBe("ok")
    expect(result.result.value).toBe(1)
    
    // Check that service record was created
    const serviceRecord = mockBlockchain.contracts["service-scheduling"].functions["get-service-record"](1)
    expect(serviceRecord.type).toBe("ok")
    expect(serviceRecord.result.value["notes"]).toBe("Cleaned all filters and surfaces")
    expect(serviceRecord.result.value["status"]).toBe("completed")
    
    // Check that schedule was updated
    const updatedSchedule = mockBlockchain.contracts["service-scheduling"].functions["get-maintenance-schedule"](1)
    expect(updatedSchedule.result.value["last-service-date"]).toBe(serviceDate)
    expect(updatedSchedule.result.value["next-service-date"]).toBe(serviceDate + 30)
  })
  
  it("should fail when recording service for non-existent schedule", () => {
    const result = mockBlockchain.contracts["service-scheduling"].functions["record-service"](
        999, // non-existent schedule ID
        1675209600,
        "Notes",
        "completed",
    )
    
    expect(result.type).toBe("err")
  })
})
