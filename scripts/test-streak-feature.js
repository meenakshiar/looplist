// PRD: TrackStreaks
/**
 * This is a utility script to test the core streak tracking functionality.
 * Run with: node scripts/test-streak-feature.js
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000';
let authToken = null;

// Test loop ID (replace with a real loop ID from your database)
let TEST_LOOP_ID = ''; // Will be created during the test

// Test user credentials (replace with valid credentials)
const TEST_USER = {
    email: 'test@example.com',
    password: 'password123'
};

/**
 * Run all tests in sequence
 */
async function runTests() {
    try {
        console.log('Starting streak feature tests...\n');

        // Step 1: Login
        console.log('1. Logging in...');
        await login();
        console.log('✅ Logged in successfully\n');

        // Step 2: Create a test loop
        console.log('2. Creating a test loop...');
        await createTestLoop();
        console.log(`✅ Created test loop with ID: ${TEST_LOOP_ID}\n`);

        // Step 3: Submit a check-in
        console.log('3. Submitting check-in for today...');
        const checkIn = await submitCheckIn();
        console.log(`✅ Check-in successful. Current streak: ${checkIn.currentStreak}\n`);

        // Step 4: Fetch loop stats
        console.log('4. Fetching loop statistics...');
        const stats = await fetchStats();
        console.log('✅ Stats retrieved successfully:');
        console.log(`   - Current streak: ${stats.currentStreak}`);
        console.log(`   - Longest streak: ${stats.longestStreak}`);
        console.log(`   - Completion rate: ${stats.completionRate}%`);
        console.log(`   - Total check-ins: ${stats.totalCheckIns}`);
        console.log(`   - Expected check-ins: ${stats.expectedCheckIns}\n`);

        // Step 5: Try to check in again (should be idempotent)
        console.log('5. Testing idempotency by submitting another check-in for today...');
        const repeatCheckIn = await submitCheckIn();
        console.log('✅ Idempotency works as expected\n');

        // Step 6: Delete check-in
        console.log('6. Deleting check-in...');
        const deleteResult = await deleteCheckIn(new Date());
        console.log(`✅ Check-in deleted. Current streak: ${deleteResult.currentStreak}\n`);

        // Step 7: Clean up - Delete the test loop
        console.log('7. Cleaning up - deleting test loop...');
        await deleteTestLoop();
        console.log('✅ Test loop deleted\n');

        console.log('All tests completed successfully! 🎉');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    }
}

/**
 * Log in and get auth token
 */
async function login() {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.token;

    return data;
}

/**
 * Create a test loop
 */
async function createTestLoop() {
    const loop = {
        title: `Test Loop ${Date.now()}`,
        frequency: 'daily',
        startDate: new Date(),
        visibility: 'private',
        iconEmoji: '🧪'
    };

    const response = await fetch(`${BASE_URL}/api/loops`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(loop)
    });

    if (!response.ok) {
        throw new Error(`Failed to create test loop: ${response.statusText}`);
    }

    const data = await response.json();
    TEST_LOOP_ID = data.loop._id;

    return data.loop;
}

/**
 * Submit a check-in for the test loop
 */
async function submitCheckIn(date = new Date()) {
    const response = await fetch(`${BASE_URL}/api/loops/${TEST_LOOP_ID}/checkin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ date: date.toISOString() })
    });

    if (!response.ok) {
        throw new Error(`Failed to submit check-in: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Fetch statistics for the test loop
 */
async function fetchStats() {
    const response = await fetch(`${BASE_URL}/api/loops/${TEST_LOOP_ID}/stats`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Delete a check-in for the test loop
 */
async function deleteCheckIn(date) {
    const dateStr = encodeURIComponent(date.toISOString());
    const response = await fetch(`${BASE_URL}/api/loops/${TEST_LOOP_ID}/checkin/${dateStr}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to delete check-in: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Delete the test loop
 */
async function deleteTestLoop() {
    const response = await fetch(`${BASE_URL}/api/loops/${TEST_LOOP_ID}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to delete test loop: ${response.statusText}`);
    }

    return await response.json();
}

// Run the tests
runTests(); 