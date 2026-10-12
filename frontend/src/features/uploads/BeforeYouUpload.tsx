import { maxUploadMb } from "./validateFile";

export function BeforeYouUpload() {
  const limit = maxUploadMb();
  return <section aria-labelledby="before-upload-title" className="before-upload">
    <h2 id="before-upload-title">Before you upload</h2>
    <h3>Required columns</h3>
    <p className="font-mono">category, amount, unit, date</p>
    <ul>
      <li>Amount must be a decimal greater than zero</li>
      <li>Date must use YYYY-MM-DD</li>
    </ul>
    <p>Maximum file size: {limit} MB</p>
    <a className="sample-download" href="/sample-activity.csv" download>Download sample CSV</a>
  </section>;
}
