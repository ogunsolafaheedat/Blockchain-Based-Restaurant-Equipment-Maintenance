import { describe, it, expect, beforeEach } from "vitest"

// Mock blockchain environment
const mockBlockchain = {
  contracts: {
    "equipment-registration": {
      state: {
        "next-equipment-id": 1,
        "equipment-registry": new Map(),
      },
      functions: {
        "register-equipment": (
            name,
            equipmentType,
            manufacturer,
            model,
            serialNumber,
            installationDate,
            warrantyExpiration,
        ) => {
          const id = mockBlockchain.contracts["equipment-registration"].state["next-equipment-id"]
          mockBlockchain.contracts["equipment-registration"].state["next-equipment-id"] += 1
          
          mockBlockchain.contracts["equipment-registration"].state["equipment-registry"].set(id, {
            name,
            "equipment-type": equipmentType,
            manufacturer,
            model,
            "serial-number": serialNumber,
            "installation-date": installationDate,
            "warranty-expiration": warrantyExpiration,
            owner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // mock tx-sender
          })
          
          return { result: { value: id }, type: "ok" }
        },
        "get-equipment": (id) => {
          const equipment = mockBlockchain.contracts["equipment-registration"].state["equipment-registry"].get(id)
          return { result: { value: equipment }, type: equipment ? "ok" : "none" }
        },
      },
    },
  },
}

describe("Equipment Registration Contract", () => {
  beforeEach(() => {
    // Reset the state before each test
    mockBlockchain.contracts["equipment-registration"].state["next-equipment-id"] = 1
    mockBlockchain.contracts["equipment-registration"].state["equipment-registry"] = new Map()
  })
  
  it("should register new equipment with valid data", () => {
    const result = mockBlockchain.contracts["equipment-registration"].functions["register-equipment"](
        "Convection Oven",
        "Cooking Equipment",
        "KitchenTech",
        "Pro5000",
        "OVEN12345",
        1672531200, // Jan 1, 2023
        1767225600, // Jan 1, 2026
    )
    
    expect(result.type).toBe("ok")
    expect(result.result.value).toBe(1)
    
    // Check that equipment was properly stored
    const storedEquipment = mockBlockchain.contracts["equipment-registration"].functions["get-equipment"](1)
    expect(storedEquipment.type).toBe("ok")
    expect(storedEquipment.result.value.name).toBe("Convection Oven")
    expect(storedEquipment.result.value["equipment-type"]).toBe("Cooking Equipment")
  })
  
  it("should increment equipment ID for each registration", () => {
    // Register first equipment
    const result1 = mockBlockchain.contracts["equipment-registration"].functions["register-equipment"](
        "Convection Oven",
        "Cooking Equipment",
        "KitchenTech",
        "Pro5000",
        "OVEN12345",
        1672531200,
        1767225600,
    )
    
    // Register second equipment
    const result2 = mockBlockchain.contracts["equipment-registration"].functions["register-equipment"](
        "Commercial Refrigerator",
        "Refrigeration",
        "CoolCo",
        "Chill500",
        "FRIDGE6789",
        1672531200,
        1767225600,
    )
    
    expect(result1.result.value).toBe(1)
    expect(result2.result.value).toBe(2)
    
    // Check that both equipments were properly stored
    const equipment1 = mockBlockchain.contracts["equipment-registration"].functions["get-equipment"](1)
    const equipment2 = mockBlockchain.contracts["equipment-registration"].functions["get-equipment"](2)
    
    expect(equipment1.result.value.name).toBe("Convection Oven")
    expect(equipment2.result.value.name).toBe("Commercial Refrigerator")
  })
  
  it("should return none for non-existent equipment", () => {
    const result = mockBlockchain.contracts["equipment-registration"].functions["get-equipment"](999)
    expect(result.type).toBe("none")
  })
})
