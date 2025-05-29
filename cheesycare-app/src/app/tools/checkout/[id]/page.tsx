"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getToolById, getPeople, getTeams, checkoutTool } from "@/lib/toolsService";
import { ToolWithCheckouts, Person, Team } from "@/lib/types";

export default function ToolCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tool, setTool] = useState<ToolWithCheckouts | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [personId, setPersonId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [toolData, peopleData, teamsData] = await Promise.all([
          getToolById(id as string),
          getPeople(),
          getTeams(),
        ]);

        if (!toolData) throw new Error("Tool not found");

        setTool(toolData);
        setPeople(peopleData);
        setTeams(teamsData);

        const numericQuantity = quantity === "" ? 0 : parseInt(quantity);
        if (toolData.available_quantity < numericQuantity) {
          setQuantity(Math.min(toolData.available_quantity, 1).toString());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!tool || !personId) {
      setError("Please fill out all required fields");
      return;
    }

    let numericQuantity = quantity === "" ? 1 : parseInt(quantity);

    if (numericQuantity <= 0) {
      setError("Quantity must be at least 1");
      return;
    }

    if (numericQuantity > tool.available_quantity) {
      setError(`Only ${tool.available_quantity} available for checkout`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const success = await checkoutTool(
        tool.id,
        personId,
        numericQuantity,
        teamId || undefined,
        notes || undefined
      );

      if (success) {
        router.push("/tools");
      } else {
        throw new Error("Failed to checkout tool");
      }
    } catch (err) {
      console.error("Error checking out tool:", err);
      setError("Failed to checkout tool. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-heading mb-4 text-blue-600">Loading...</h1>
      </div>
    );
  }

  if (error && !tool) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-heading mb-4 text-blue-600">Error</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <Link href="/tools" className="text-blue-600 hover:underline">
          Back to Tools
        </Link>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-heading mb-4 text-blue-600">Tool Not Found</h1>
        <Link href="/tools" className="text-blue-600 hover:underline">
          Back to Tools
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-heading mb-4 text-blue-600">Checkout Tool</h1>
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h2>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-700 font-medium">Category:</span>
          <span className="text-sm font-medium text-gray-900">{tool.category || "Uncategorized"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 font-medium">Available:</span>
          <span className="text-sm font-medium text-gray-900">{tool.available_quantity} of {tool.total_quantity}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200">
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="personId" className="block text-gray-800 font-medium mb-1">
            Person <span className="text-red-500">*</span>
          </label>
          <select
            id="personId"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            required
          >
            <option value="">Select a person</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="teamId" className="block text-gray-800 font-medium mb-1">
            Team (Optional)
          </label>
          <select
            id="teamId"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="">No team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                Team {team.number} - {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="quantity" className="block text-gray-800 font-medium mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            max={tool.available_quantity}
            value={quantity}
            onChange={(e) => {
              if (e.target.value === "") {
                setQuantity("");
                return;
              }
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {
                setQuantity(Math.min(val, tool.available_quantity).toString());
              }
            }}
            onBlur={() => {
              if (quantity === "" || parseInt(quantity) < 1) {
                setQuantity("1");
              }
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            required
          />
          <p className="text-sm text-gray-700 mt-1">
            Maximum available: {tool.available_quantity}
          </p>
        </div>
        <div className="mb-6">
          <label htmlFor="notes" className="block text-gray-800 font-medium mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            rows={3}
          ></textarea>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || tool.available_quantity === 0 || quantity === ""}
            className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? "Processing..." : "Check Out Tool"}
          </button>
          <Link
            href="/tools"
            className="py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
