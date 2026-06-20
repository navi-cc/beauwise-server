export async function getEmulatorStatus(): Promise<boolean> {
	let status: boolean;

	try {
		const response = await fetch('http://127.0.0.1:4000/');

		status = response.ok;
	} catch {
		status = false;
	}

	return status;
}
