

import React, { useMemo, useState, useEffect } from 'react';
import Card from './Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import type { Refueling, Vehicle } from '../../types';

interface ConsumptionAnalyticsProps {
  refuelings: Refueling[];
  vehicles: Vehicle[];
}

const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28"];

const ConsumptionAnalytics: React.FC<ConsumptionAnalyticsProps> = ({ refuelings, vehicles }) => {
    
    const analyticsData = useMemo(() => {
        if (refuelings.length === 0) return { vehicleStats: [], fleetAverage: 0 };

        const refuelingsByVehicle = refuelings.reduce((acc, r) => {
            if (r.currentOdometer > r.previousOdometer && r.quantityLiters > 0) {
                 if (!acc[r.vehicleId]) acc[r.vehicleId] = [];
                 acc[r.vehicleId].push(r);
            }
            return acc;
        }, {} as Record<string, Refueling[]>);

        const vehicleStats = Object.entries(refuelingsByVehicle).map(([vehicleId, vehicleRefuelings]: [string, Refueling[]]) => {
            const vehicleInfo = vehicles.find(v => v.id === vehicleId);
            if (!vehicleInfo) return null;

            const totalKm = vehicleRefuelings.reduce((sum, r) => sum + (r.currentOdometer - r.previousOdometer), 0);
            const totalLiters = vehicleRefuelings.reduce((sum, r) => sum + r.quantityLiters, 0);
            const averageKmL = totalLiters > 0 ? totalKm / totalLiters : 0;
            
            const consumptionHistory = vehicleRefuelings.map(r => ({
                date: new Date(r.date).getTime(),
                kmL: r.quantityLiters > 0 ? (r.currentOdometer - r.previousOdometer) / r.quantityLiters : 0,
            })).sort((a, b) => a.date - b.date);

            return { vehicleId, plate: vehicleInfo.plate, model: vehicleInfo.model, totalKm, totalLiters, averageKmL, consumptionHistory };
        }).filter(Boolean) as any[];

        const totalFleetKm = vehicleStats.reduce((sum, v) => sum + v.totalKm, 0);
        const totalFleetLiters = vehicleStats.reduce((sum, v) => sum + v.totalLiters, 0);
        const fleetAverage = totalFleetLiters > 0 ? totalFleetKm / totalFleetLiters : 0;
        
        const statsWithDeviation = vehicleStats.map(stat => {
            const deviation = fleetAverage > 0 ? (stat.averageKmL / fleetAverage) - 1 : 0;
            let status: 'good' | 'average' | 'bad' = 'average';
            let statusText = 'Na Média';
            if (deviation < -0.15) { status = 'bad'; statusText = 'Consumo Elevado'; } 
            else if (deviation > 0.15) { status = 'good'; statusText = 'Eficiente'; }
            return { ...stat, deviation, status, statusText };
        });

        return { vehicleStats: statsWithDeviation.sort((a, b) => b.totalLiters - a.totalLiters), fleetAverage };
    }, [refuelings, vehicles]);

    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
    
    useEffect(() => {
        // Pre-select top 3 vehicles with most data
        setSelectedVehicles(analyticsData.vehicleStats.slice(0, 3).map(v => v.vehicleId));
    }, [analyticsData]);

    const handleVehicleSelection = (vehicleId: string) => {
        setSelectedVehicles(prev => prev.includes(vehicleId) ? prev.filter(id => id !== vehicleId) : [...prev, vehicleId]);
    };

    const chartData = useMemo(() => {
        const dataPoints: { [key: number]: { date: number } & Record<string, number> } = {};
        
        analyticsData.vehicleStats
            .filter(v => selectedVehicles.includes(v.vehicleId))
            .forEach(vehicle => {
                vehicle.consumptionHistory.forEach(hist => {
                    if (!dataPoints[hist.date]) dataPoints[hist.date] = { date: hist.date };
                    dataPoints[hist.date][vehicle.plate] = parseFloat(hist.kmL.toFixed(2));
                });
            });

        return Object.values(dataPoints).sort((a, b) => a.date - b.date);
    }, [analyticsData.vehicleStats, selectedVehicles]);

    if (analyticsData.vehicleStats.length === 0) {
        return (
            <Card>
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Análise de Consumo</h2>
                <p className="text-text-secondary">Não há dados de abastecimento suficientes nos filtros selecionados para gerar uma análise.</p>
            </Card>
        );
    }

    const StatusBadge: React.FC<{ status: 'good' | 'average' | 'bad'; text: string; }> = ({ status, text }) => {
        const colorClasses = {
            good: 'bg-success/20 text-success',
            average: 'bg-gray-200 text-gray-700',
            bad: 'bg-danger/20 text-danger',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[status]}`}>{text}</span>;
    };

    return (
        <Card>
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Painel de Indicadores de Consumo</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {analyticsData.vehicleStats.map(v => (
                    <div key={v.vehicleId} className="p-4 border rounded-lg text-center shadow-sm">
                        <p className="font-bold text-text-primary">{v.plate}</p>
                        <p className="text-xs text-text-secondary">{v.model}</p>
                        <p className="text-2xl font-bold text-secondary my-1">{v.averageKmL.toFixed(2)}</p>
                        <p className="text-sm text-text-secondary -mt-1 mb-2">km/L</p>
                        <StatusBadge status={v.status} text={v.statusText} />
                    </div>
                ))}
            </div>

            <div className="mt-6 border-t pt-4">
                 <h3 className="text-lg font-semibold mb-2">Comparativo de Consumo (km/L por Abastecimento)</h3>
                 <div className="flex flex-wrap gap-2 mb-4">
                     {analyticsData.vehicleStats.map(v => (
                        <label key={v.vehicleId} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                             <input type="checkbox" checked={selectedVehicles.includes(v.vehicleId)} onChange={() => handleVehicleSelection(v.vehicleId)} className="rounded text-primary focus:ring-primary" />
                             <span className="text-sm">{v.plate}</span>
                        </label>
                     ))}
                 </div>
                 <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(time) => new Date(time).toLocaleDateString()} type="number" domain={['dataMin', 'dataMax']}>
                                 <Label value="Data do Abastecimento" offset={-15} position="insideBottom" />
                            </XAxis>
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']}>
                                <Label value="Consumo (km/L)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                            </YAxis>
                            <Tooltip labelFormatter={(time) => new Date(time).toLocaleString()} formatter={(value: number) => [value.toFixed(2), "km/L"]} />
                            <Legend wrapperStyle={{ bottom: 0 }}/>
                            {analyticsData.vehicleStats
                                .filter(v => selectedVehicles.includes(v.vehicleId))
                                .map((v, i) => <Line key={v.vehicleId} type="monotone" dataKey={v.plate} stroke={colors[i % colors.length]} connectNulls />)}
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </Card>
    );
};

export default ConsumptionAnalytics;