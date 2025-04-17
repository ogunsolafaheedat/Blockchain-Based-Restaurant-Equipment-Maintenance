import { describe, it, expect, beforeEach } from "vitest"

// Mock blockchain environment
const mockBlockchain = {
  contracts: {
    "compliance-tracking": {
      state: {
        "next-requirement-id": 1,
        "next-record-id": 1,
        "admin-principal": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // mock admin
        "compliance-requirements": new Map(),
        "compliance-records": new Map(),
      },
      functions: {
        "create-compliance-requirement": (title, description, equipmentType, frequencyDays) => {
          if (mockBlockchain.tx.sender !== mockBlockchain.contracts["compliance-tracking"].state["admin-principal"]) {
            return { result: { value: 1 }, type: "err" }
          }
          
          const requirementId = mockBlockchain.contracts["compliance-tracking"].state["next-requirement-id"]
          mockBlockchain.contracts["compliance-tracking"].state["next-requirement-id"] += 1
          
          mockBlockchain.contracts["compliance-tracking"].state["compliance-requirements"].set(requirementId, {
            title,
            description,
            "equipment-type": equipmentType,
            "frequency-days": frequencyDays,
            "is-active": true,
            "created-by": mockBlockchain.tx.sender,
          })
          
          return { result: { value: requirementId }, type: "ok" }
        },
        "get-compliance-requirement": (requirementId) => {
          const requirement =
              mockBlockchain.contracts["compliance-tracking"].state["compliance-requirements"].get(requirementId)
          return { result: { value: requirement }, type: requirement ? "ok" : "none" }
        },
        "record-compliance-inspection": (equipmentId, requirementId, inspectionDate, notes, passed) => {
          const requirement =
              mockBlockchain.contracts["compliance-tracking"].state["compliance-requirements"].get(requirementId)
          
          if (!requirement) {
            return { result: { value: 1 }, type: "err" }
          }
          
          const recordId = mockBlockchain.contracts["compliance-tracking"].state["next-record-id"]
          mockBlockchain.contracts["compliance-tracking"].state["next-record-id"] += 1
          
          mockBlockchain.contracts["compliance-tracking"].state["compliance-records"].set(recordId, {
            "equipment-id": equipmentId,
            "requirement-id": requirementId,
            "inspection-date": inspectionDate,
            inspector: mockBlockchain.tx.sender,
            notes: notes,
            passed: passed,
            "next-due-date": inspectionDate + requirement["frequency-days"],
          })
          
          return { result: { value: recordId }, type: "ok" }
        },
        "get-compliance-record": (recordId) => {
          const record = mockBlockchain.contracts["compliance-tracking"].state["compliance-records"].get(recordId)
          return { result: { value: record }, type: record ? "ok" : "none" }
        },
      },
    },
  },
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // mock tx-sender (admin)
  },
}

describe("Compliance Tracking Contract", () => {
  beforeEach(() => {
    // Reset the state before each test
    mockBlockchain.contracts["compliance-tracking"].state["next-requirement-id"] = 1
    mockBlockchain.contracts["compliance-tracking"].state["next-record-id"] = 1
    mockBlockchain.contracts["compliance-tracking"].state["compliance-requirements"] = new Map()
    mockBlockchain.contracts["compliance-tracking"].state["compliance-records"] = new Map()
    mockBlockchain.tx.sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" // reset to admin
  })
  
  it("should create a compliance requirement with valid data", () => {
    const result = mockBlockchain.contracts["compliance-tracking"].functions["create-compliance-requirement"](
        "Health Department Inspection",
        "Regular inspection required by local health department",
        "All Kitchen Equipment",
        90, // every 90 days
    )
    
    expect(result.type).toBe("ok")
    expect(result.result.value).toBe(1)
    
    // Check that requirement was properly stored
    const storedRequirement = mockBlockchain.contracts["compliance-tracking"].functions["get-compliance-requirement"](1)
    expect(storedRequirement.type).toBe("ok")
    expect(storedRequirement.result.value.title).toBe("Health Department Inspection")
    expect(storedRequirement.result.value["equipment-type"]).toBe("All Kitchen Equipment")
    expect(storedRequirement.result.value["frequency-days"]).toBe(90)
  })
  
  it("should record a compliance inspection and set next due date", () => {
    // First create a requirement
    mockBlockchain.contracts["compliance-tracking"].functions["create-compliance-requirement"](
        "Health Department Inspection",
        "Regular inspection required by local health department",
        "All Kitchen Equipment",
        90, // every 90 days
    )
    
    // Now record an inspection
    const inspectionDate = 1675209600 // Feb 1, 2023
    const result = mockBlockchain.contracts["compliance-tracking"].functions["record-compliance-inspection"](
        1, // equipment ID
        1, // requirement ID
        inspectionDate,
        "All equipment passed inspection",
        true, // passed
    )
    
    expect(result.type).toBe("ok")
    expect(result.result.value).toBe(1)
    
    // Check that record was created
    const record = mockBlockchain.contracts["compliance-tracking"].functions["get-compliance-record"](1)
    expect(record.type).toBe("ok")
    expect(record.result.value["notes"]).toBe("All equipment passed inspection")
    expect(record.result.value["passed"]).toBe(true)
    expect(record.result.value["next-due-date"]).toBe(inspectionDate + 90)
  })
  
  it("should not allow non-admin to create requirements", () => {
    // Change sender to non-admin
    mockBlockchain.tx.sender = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = mockBlockchain.contracts["compliance-tracking"].functions["create-compliance-requirement"](
        "Health Department Inspection",
        "Regular inspection required by local health department",
        "All Kitchen Equipment",
        90,
    )
    
    expect(result.type).toBe("err")
  })
  
  it("should fail when recording inspection for non-existent requirement", () => {
    const result = mockBlockchain.contracts["compliance-tracking"].functions["record-compliance-inspection"](
        1, // equipment ID
        999, // non-existent requirement ID
        1675209600,
        "Notes",
        true,
    )
    
    expect(result.type).toBe("err")
  })
})
