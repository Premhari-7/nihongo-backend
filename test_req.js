async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Admin',
                email: 'admin2@example.com',
                password: 'Password123!',
                role: 'admin',
                adminCode: '25112006'
            })
        });
        const data = await res.text();
        console.log(res.status, data);
    } catch (err) {
        console.error(err);
    }
}
test();
