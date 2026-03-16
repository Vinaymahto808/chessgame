export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white text-lg">
            ♔
          </div>
          <span className="text-xl font-bold text-[#1A1A2E]">Chess</span>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-gray-500 text-sm">Privacy Policy</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-[#1A1A2E] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="space-y-10 text-[#1A1A2E]">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
            <p className="text-gray-600 leading-relaxed">
              Chess ("we", "our", or "the app") is a mobile chess application that allows users to play chess against an AI opponent or in a 2-player pass-and-play mode. We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-[#2D6A4F] mb-2">Locally Stored Data</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  All game data — including your username, avatar, game history, and move records — is stored exclusively on your device using AsyncStorage. This data never leaves your device and is not transmitted to any server.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-[#2D6A4F] mb-2">Online Game Data</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  If you use the online 2-player mode, player names and game state (FEN positions, moves) are stored on our server solely to facilitate gameplay. No personally identifiable information beyond the player name you provide is collected.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-[#2D6A4F] mb-2">Data We Do NOT Collect</h3>
                <ul className="text-gray-600 text-sm leading-relaxed list-disc list-inside space-y-1">
                  <li>Email addresses or passwords</li>
                  <li>Phone numbers or contact information</li>
                  <li>Location data</li>
                  <li>Device identifiers or advertising IDs</li>
                  <li>Payment or financial information</li>
                  <li>Browsing history or third-party app data</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We use the minimal data collected solely to:</p>
            <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-2">
              <li>Display your username and avatar within the app</li>
              <li>Save and restore your game progress locally</li>
              <li>Enable online 2-player game sessions</li>
              <li>Show your game history and statistics</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              We do not sell, rent, or share your data with any third parties for marketing or advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Storage & Security</h2>
            <p className="text-gray-600 leading-relaxed">
              Local game data is stored using React Native AsyncStorage on your device. Online game data is stored in a PostgreSQL database with standard security practices. We do not use cookies or tracking technologies. Data is retained only as long as necessary to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Chess is suitable for all ages. We do not knowingly collect any personal information from children under 13. Since the app requires no account registration and stores only a display name locally, it is safe for children to use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">You have full control over your data:</p>
            <ul className="text-gray-600 leading-relaxed list-disc list-inside space-y-2">
              <li><strong>Delete local data:</strong> Uninstalling the app removes all locally stored data</li>
              <li><strong>Delete online games:</strong> Use the delete button on any game card in the app</li>
              <li><strong>Change username:</strong> Log out and create a new profile at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              The app uses Expo (by Expo Inc.) as its development framework. Expo may collect anonymous crash and usage analytics as part of its SDK. Please refer to <a href="https://expo.dev/privacy" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">Expo's Privacy Policy</a> for details. No other third-party analytics, advertising, or tracking SDKs are integrated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated date. Continued use of the app after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@chessgame.app" className="text-[#2D6A4F] underline">
                privacy@chessgame.app
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© {new Date().getFullYear()} Chess App. All rights reserved.</span>
          <span>Made with ♟ for chess lovers</span>
        </div>
      </footer>
    </div>
  );
}
