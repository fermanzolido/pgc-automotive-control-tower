import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
// FIX: The type 'Salesperson' does not exist. It has been replaced with 'User' as per the project's type definitions.
// FIX: Changed 'Sale' to 'EnrichedSale' to match the data passed from the parent component and resolve property access errors.
import type { ChatMessage, EnrichedSale, Vehicle, Dealership, User, DemandForecast } from '../types';
import { SparklesIcon, PaperAirplaneIcon, XIcon, ChevronDownIcon, TrendingUpIcon } from './icons/DashboardIcons';

interface AI_AssistantProps {
    sales: EnrichedSale[];
    vehicles: Vehicle[];
    dealerships: Dealership[];
    salespeople: User[];
    demandForecasts: DemandForecast[];
}

const AI_Assistant: React.FC<AI_AssistantProps> = ({ sales, vehicles, dealerships, salespeople, demandForecasts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const modelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', text: '' };
        setMessages(prev => [...prev, modelMessage]);

        try {
            // FIX: Initialize GoogleGenAI according to guidelines, without casting API_KEY.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const dataContext = `
                Analyze the following JSON data representing the current state of our automotive dealership network.
                - Today's date is ${new Date().toLocaleDateString('es-AR')}.
                - There are ${dealerships.length} dealerships.
                - There are ${vehicles.length} total vehicles in the network.
                - There have been ${sales.length} recent sales.

                 dealerships: ${JSON.stringify(dealerships.map(({id, name, city, province}) => ({id, name, city, province})))}
                
                 sales (last 20): ${JSON.stringify(sales.slice(0, 20).map(s => ({
                    model: s.vehicle.model,
                    price: s.salePrice,
                    dealership: s.dealership.name,
                    salesperson: s.salesperson.name,
                    date: s.timestamp.toISOString().split('T')[0]
                 })))}
                 
                 inventory_summary: ${JSON.stringify(vehicles.reduce((acc, v) => {
                    acc[v.status] = (acc[v.status] || 0) + 1;
                    return acc;
                 }, {} as Record<string, number>))}
            `;
            
            // FIX: Separate system instruction from prompt and use the 'config' property, following Gemini API best practices.
            const systemInstruction = `Eres "Asistente PGC", un analista experto en datos de la industria automotriz. Tu rol es ayudar al Gerente de Operaciones de la fábrica a entender el rendimiento de su red de concesionarios. Responde en español, de forma concisa y profesional. Utiliza formato Markdown (negritas, listas) para mejorar la legibilidad. Basa tus respuestas únicamente en los datos proporcionados.`;
            const userPrompt = `Contexto de datos: ${dataContext}. Pregunta del usuario: ${input}`;

            const stream = await ai.models.generateContentStream({
                model: "gemini-2.5-flash",
                contents: userPrompt,
                config: {
                    systemInstruction,
                },
            });

            let currentText = '';
            for await (const chunk of stream) {
                currentText += chunk.text;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === modelMessage.id ? { ...msg, text: currentText } : msg
                    )
                );
            }

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessage.id ? { ...msg, text: "Lo siento, ocurrió un error al procesar tu solicitud." } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 z-50"
                aria-label="Abrir Asistente de IA"
            >
                <SparklesIcon className="w-8 h-8 text-white" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50">
            <header className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
                <div className="flex items-center space-x-2">
                    <SparklesIcon className="w-6 h-6 text-cyan-400" />
                    <h3 className="font-bold text-white">Asistente de IA</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-700"
                    aria-label="Cerrar Asistente de IA"
                >
                    <ChevronDownIcon className="w-6 h-6 text-gray-400" />
                </button>
            </header>

            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                            <h4 className="font-bold text-cyan-400 mb-2">Previsión de Demanda (Próximo Mes)</h4>
                            {demandForecasts.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-400 uppercase">
                                        <tr>
                                            <th className="py-2">Modelo</th>
                                            <th className="py-2">Provincia</th>
                                            <th className="py-2 text-right">Ventas Previstas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {demandForecasts.sort((a,b) => b.forecastedSales - a.forecastedSales).map(f => (
                                            <tr key={f.id}>
                                                <td className="py-2 font-medium">{f.model}</td>
                                                <td className="py-2 text-gray-400">{f.province}</td>
                                                <td className="py-2 text-right font-bold text-cyan-400">{f.forecastedSales}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500">No hay datos de previsión disponibles. El cálculo se ejecuta semanalmente.</p>
                            )}
                        </div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }}/>
                                {isLoading && msg.role === 'model' && msg.text === '' && (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75"></div>
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700 flex items-center space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregúntale a tus datos..."
                    disabled={isLoading}
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-cyan-500 text-white rounded-full p-2 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Enviar pregunta"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default AI_Assistant;