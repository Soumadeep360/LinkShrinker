# LinkShrinker

## 📋 Project Description
This is a **URL Shortener** web application that allows users to create short, easy-to-share links for any URL. The application also includes features like **custom short URLs**, **click tracking**, and **expiration dates** for links. To optimize performance, frequently accessed URLs are cached using **Redis**, reducing load on the **MongoDB** database and enhancing response times.

## 🚀 Features
- **Create Short URLs**: Convert long URLs into shorter, more manageable links.
- **Custom Short URLs**: Users can choose their own custom short URLs if available.
- **Expiration Dates**: Set expiration dates for short links to automatically expire after a certain period.
- **Click Tracking**: Track the number of times a link has been accessed, along with the last accessed timestamp.
- **Caching with Redis**: Improve performance by caching URLs and reducing database lookups for frequently accessed links.
- **Responsive UI**: User-friendly interface built with EJS templating.

## 🛠️ Technologies Used
- **Node.js**: Backend server.
- **Express.js**: Web framework for building the REST API.
- **MongoDB Atlas**: NoSQL database for storing URL data.
- **Redis**: In-memory cache to speed up URL redirections.
- **Mongoose**: MongoDB object modeling tool for Node.js.
- **EJS**: Template engine for rendering HTML views.
- **Moment.js**: For handling date and time operations.

## ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/url-shortener.git
   cd url-shortener
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the project root with the following:
     ```
     PORT=5000
     MONGODB_URI=<Your MongoDB Atlas Connection String>
     REDIS_URI=<Your Redis Host>
     REDIS_PASSWORD=<Your Redis Password>
     ```

4. **Run the application**:
   ```bash
   npm start
   ```

5. **Access the application**:
   Open your browser and go to `http://localhost:5000`.


## 🧩 Usage

- **Creating a Short URL**:
  - Enter a long URL in the input box and click the "Shorten" button.
  - Optionally, specify a custom short URL or expiration date.

- **Accessing a Short URL**:
  - Copy the shortened link and open it in your browser to be redirected to the original URL.

- **Deleting a Short URL**:
  - You can delete a short URL from the dashboard.

## 📈 Performance Optimization
- Uses **Redis** for caching frequently accessed URLs, significantly reducing response time.
- MongoDB for scalable and efficient data storage.
- Indexing in MongoDB ensures quick lookups for existing short URLs.

## 🛡️ Security
- Environment variables are used to protect sensitive information like database credentials.
- Input validation is implemented to prevent invalid URLs and ensure data integrity.

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.

## 📝 License
This project is licensed under the MIT License.

---
