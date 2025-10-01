<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unauthorized Access</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .error-container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error-code {
            font-size: 4rem;
            font-weight: bold;
            color: #e53e3e;
            margin-bottom: 1rem;
        }
        .error-message {
            font-size: 1.5rem;
            color: #4a5568;
            margin-bottom: 1rem;
        }
        .error-description {
            color: #718096;
            margin-bottom: 2rem;
        }
        .back-button {
            background-color: #3182ce;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            text-decoration: none;
            display: inline-block;
        }
        .back-button:hover {
            background-color: #2c5aa0;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">403</div>
        <div class="error-message">Unauthorized Access</div>
        <div class="error-description">
            You don't have permission to access this resource.
        </div>
        <a href="{{ url('dashboard') }}" class="back-button">Dashboard</a>
    </div>
</body>
</html>



