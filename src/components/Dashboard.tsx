import Navbar from "./Navbar";

const Dashboard = () => {
  return (
    <div>
      <Navbar />
      <main className="p-8">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">
          Your Reading List
        </h2>
        <p className="text-slate-500">
          Lu udah login. Sekarang aplikasi siap buat narik data manhwa dari
          database!
        </p>

        {/* Nanti di sini kita render list komiknya */}
      </main>
    </div>
  );
};

export default Dashboard;
