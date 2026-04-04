function Card({title,value}) {

  return (
    <div className="bg-white/40 backdrop-blur-lg p-6 rounded-2xl shadow-md">

      <p className="text-gray-500">{title}</p>

      <h2 className="text-2xl font-bold text-teal-700 mt-2">
        {value}
      </h2>

    </div>
  )
}

export default Card