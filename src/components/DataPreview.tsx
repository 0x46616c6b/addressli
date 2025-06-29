import React from "react";
import type { CSVRow } from "../types";

interface DataPreviewProps {
  data: CSVRow[];
  headers: string[];
  maxRows?: number;
}

export function DataPreview({ data, headers, maxRows = 5 }: DataPreviewProps): React.JSX.Element {
  const previewData = data.slice(0, maxRows);

  if (!data.length || !headers.length) {
    return <div className="text-center py-8 text-gray-500">No data available to display</div>;
  }

  return (
    <div className="w-full">
      <h3 id="data-preview-heading" className="text-lg font-medium text-gray-900 mb-4">
        Data Preview
      </h3>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {previewData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[header] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-sm text-gray-500 text-center">
        Showing {previewData.length} of {data.length} rows
        {data.length > maxRows && <span> • {data.length - maxRows} more rows available</span>}
      </div>
    </div>
  );
}
