document.getElementById('startBtn').addEventListener('click', async () => {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const messageEl = document.getElementById('message');
    const btn = document.getElementById('startBtn');

    if (!phoneNumber) {
        messageEl.textContent = "Please enter a phone number.";
        messageEl.className = "error";
        return;
    }

    btn.disabled = true;
    messageEl.textContent = "Initiating call...";
    messageEl.className = "";

    try {
        const response = await fetch('/api/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber })
        });

        if (response.ok) {
            messageEl.textContent = "Call initiated successfully! Check server console for progress.";
            messageEl.className = "success";
        } else {
            const data = await response.json();
            messageEl.textContent = "Error: " + (data.error || "Failed to start call");
            messageEl.className = "error";
        }
    } catch (error) {
        messageEl.textContent = "Network error: " + error.message;
        messageEl.className = "error";
    } finally {
        btn.disabled = false;
    }
});
