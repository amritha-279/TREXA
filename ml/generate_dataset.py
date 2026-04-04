import pandas as pd
import random

data = []

for i in range(500):

    rain = random.randint(0,120)
    aqi = random.randint(20,300)
    traffic = random.randint(1,10)
    deliveries = random.randint(0,35)

    disruption = 0

    if rain > 70 or aqi > 180 or deliveries < 8:
        disruption = 1

    data.append([rain,aqi,traffic,deliveries,disruption])

df = pd.DataFrame(data, columns=[
    "rain_mm","aqi","traffic","deliveries","disruption"
])

df.to_csv("dataset.csv", index=False)

print("Dataset created successfully")