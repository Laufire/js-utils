const defaultCount = 100;
const TestConfig = {
	retryCount: Number(process.env.retryCount || defaultCount),
};

export default TestConfig;
