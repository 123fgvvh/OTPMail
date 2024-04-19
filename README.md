# User Authentication Project

This project is a simple user authentication system built using Node.js, Express, MySQL, and Nodemailer. It enables users to sign up, log in, reset their password, and verify their email through OTP.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- User registration with unique email validation
- Secure password storage using MySQL database
- Login with email and password
- Forgot password functionality with OTP verification
- Password reset mechanism
- Simple and clean user interface

## Technologies Used

- Node.js
- Express
- MySQL
- Nodemailer
- EJS (Embedded JavaScript) for views
- Tailwind CSS for styling

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js and npm
- MySQL database

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd <project-directory>
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

### Configuration

1. Create a MySQL database and configure the connection details in `app.js`.
2. Set up your Gmail account and configure the Nodemailer transporter with your email and an App Password.

## Usage

1. Start the server:

   ```bash
   npm start
   ```

2. Visit [http://localhost:8000/login](http://localhost:8000/login) in your web browser.
3. Register a new account, log in, and explore the user authentication features.

## Contributing

Contributions are welcome! If you find any issues or want to enhance the project, feel free to open an issue or submit a pull request.

## License

[MIT License](LICENSE)
