interface AttendanceChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title: string;
}

const AttendanceChart = ({ data, title }: AttendanceChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-4">
        {/* Simple progress bars instead of pie chart */}
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.value} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-center">
          <span className="text-2xl font-bold text-foreground">{total}</span>
          <p className="text-sm text-muted-foreground">Total Records</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;