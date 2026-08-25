// Simple test script to verify farm creation functionality
// This script can be run in the browser console or as a test

async function testFarmCreation() {
    try {
        // Test data
        const testData = {
            name: "Test Farm",
            areaHa: 10.5,
            location: "Test Location"
        };

        console.log("Testing farm creation with data:", testData);

        // Make a POST request to the farms create endpoint
        const response = await fetch('/api/rpc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'farms.create',
                params: testData
            })
        });

        const result = await response.json();
        console.log("Response:", result);

        if (result.result) {
            console.log("✅ Farm created successfully!");
            console.log("Created farm:", result.result);
            return result.result;
        } else {
            console.log("❌ Farm creation failed:", result.error);
            return null;
        }
    } catch (error) {
        console.error("❌ Error during test:", error);
        return null;
    }
}

// Run the test
testFarmCreation();