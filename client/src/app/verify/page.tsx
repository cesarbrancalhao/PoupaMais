import Image from "next/image";
import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm p-12 md:p-12 w-full max-w-md md:max-w-lg min-h-96 space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="rounded-full p-6">
            <Image src="/hourglass.svg" alt="Icon" width={100} height={100} />
          </div>
          <p className="mt-6 p-2 text-gray-700 text-base">
            If the account exists, we will send a password recovery link.
          </p>
        </div>

        <Link
          href="/auth"
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
