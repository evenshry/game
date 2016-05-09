<?php
/**
 * 数据库接口
 * @authors Nemo (heady713@gmail.com)
 * @date    2016-04-12 12:55:46
 * @version $Id$
 */

require_once "medoo.php";

class DbService {
	/**
	 * private database connection
	 * @var [class medoo]
	 */
	private $db;

	/**
	 * construct function of class DbService
	 */
	public function __construct() {
		$this->db = new medoo([
			// required
			'database_type' => 'mysql',
			'database_name' => 'game_12306',
			 'server'        => 'localhost',
			'username'      => 'root',
			// 'password'      => 'tydic2016',
			'password'    => 'ZQH4996197!=',
			'charset'       => 'utf8',
			
			// [optional]
			'port' => 3306,
			
			// [optional] Table prefix
			// 'prefix' => 'PREFIX_',
			
			// driver_option for connection, read more from http://www.php.net/manual/en/pdo.setattribute.php
			'option' => [
				// PDO::ATTR_CASE => PDO::CASE_NATURAL
			]
		]);
	}

	/**
	 * return if has a database error
	 * @return boolean
	 */
	public function hasErr() {
		$error = $this->db->error();
		if (empty($error[2])) {
			return false;
		} else {
			var_dump($this->db->last_query());
			var_dump($this->db->error());
			return true;
		}
	}


	/**
	 * 总玩家数量
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function playerTotalCount(&$ack) {
		$cnt = $this->db->count("record");
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}
		$ack["cnt"] = $cnt;
		$ack["ret"] = 0;
		return true;
	}


	/**
	 * 完成游戏记录
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function gameFinish($qry, &$ack) {
		if (!array_key_exists("total_time", $qry) ||
			!array_key_exists("gmf_times", $qry)) {
			$ack["ret"] = 1;
			return false;
		}
		$total_time = $qry["total_time"];
		$gmf_times  = $qry["gmf_times"];

		$uid = -1;
		if (array_key_exists("uid", $qry) && $qry["uid"] != "") {
			//已有记录用户
			$uid  = $qry["uid"];

			$this->db->update("record", [
					"gmf_times[+]" => $gmf_times,
					"play_times[+]" => 1, 
					"#modify_time" => "NOW()"
				], [
					"uid" => $uid
				]
			);
			if ($this->hasErr()) {
				$ack["ret"] = 2;
				return false;
			}

			$this->db->update("record", [
					"total_time" => $total_time
				], [
					"AND" => [
						"uid" => $uid,
						"total_time[>]" => $total_time
					]
				]
			);
			if ($this->hasErr()) {
				$ack["ret"] = 2;
				return false;
			}
		} else {
			//新用户
			$uid = $this->db->insert("record", [
					"gmf_times"    => $gmf_times,
					"total_time"   => $total_time,
					"play_times"   => 1,
					"#create_time" => "NOW()",
					"#modify_time" => "NOW()"
				]
			);
			if ($this->hasErr()) {
				$ack["ret"] = 2;
				return false;
			}
		}

		$results = $this->db->query(
			"SELECT count(a.uid)+1 AS rank_id, b.total_time, b.gmf_times, b.gift, b.win " .
			"FROM record a, record b WHERE b.uid = " . $this->db->quote($uid) .
			" AND a.total_time < b.total_time;"
		)->fetchAll();
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}
		$results = $results[0];

		$cnt = $this->db->count("record");
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}
		$ack["pcnt"]       = $cnt;
		$ack["uid"]        = $uid;
		$ack["gmf_times"]  = $results["gmf_times"];
		$ack["total_time"] = $results["total_time"];
		$ack["rank_id"]    = $results["rank_id"];
		$ack["gift"]       = $results["gift"];
		$ack["win"]        = $results["win"];

		$ack["ret"] = 0;
		return true;
	}

	/**
	 * top10
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function top10($qry, &$ack) {
		if (!array_key_exists("uid", $qry)) {
			$ack["ret"] = 1;
			return false;
		}
		$uid = $qry["uid"];

		$cnt = $this->db->count("record", [
				"phone_no"
			], [
				"and" => [
					"uid" => $uid,
					"phone_no[!]" => NULL
				]
			]
		);
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		if ($cnt != 1) {
			$ack["ret"] = 3;
			return false;
		}

		$results = $this->db->query(
			"select if(name is null, '无名大侠', concat(left(name,1),'*')) as name, concat(left(phone_no,3),'*****',right(phone_no,3)) phone_no, " .
			"total_time, gmf_times from record order by total_time, gmf_times desc, uid limit 10"
		)->fetchAll();

		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		$ack["top10"] = $results;

		$results = $this->db->query(
			"SELECT count(a.uid)+1 AS rank_id, b.total_time, b.gmf_times, b.gift, b.win " .
			"FROM record a, record b WHERE b.uid = " . $this->db->quote($uid) .
			" AND a.total_time < b.total_time;"
		)->fetchAll();
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}
		$results = $results[0];
		$ack["gmf_times"]  = $results["gmf_times"];
		$ack["total_time"] = $results["total_time"];
		$ack["rank_id"]    = $results["rank_id"];
		$ack["gift"]       = $results["gift"];
		$ack["win"]        = $results["win"];

		$ack["ret"] = 0;
		return true;
	}


	/**
	 * 填写个人信息
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function playerInfo($qry, &$ack) {
		if (!array_key_exists("uid", $qry) || 
			!array_key_exists("phone_no", $qry) ||
			!array_key_exists("name", $qry)) {
			$ack["ret"] = 1;
			return false;
		}
		$uid      = $qry["uid"];
		$phone_no = $qry["phone_no"];
		$name     = $qry["name"];

		//判断电话号码是否唯一
		$results = $this->db->select("record", [
				"phone_no"
			], [
				"phone_no" => $phone_no
			]
		);
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		if (count($results) > 0) {
			$ack["ret"] = 3;
			return false;
		}

		$this->db->update("record", [
				"phone_no" => $phone_no,
				"name" => $name,
				"#modify_time" => "NOW()"
			], [
				"uid" => $uid
			]
		);
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		$ack["ret"] = 0;
		return true;
	}


	/**
	 * 抽奖
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function gift($qry, &$ack) {
		if (!array_key_exists("uid", $qry)) {
			$ack["ret"] = 1;
			return false;
		}
		$uid = $qry["uid"];

		$cnt = $this->db->count("record", [
				"uid"
			], [
				"AND" => [
					"uid" => $uid,
					"gift" => 1
				]
			]
		);
		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		if ($cnt == 1) {
			$ack["ret"] = 3;
			return false;
		}

		$r = rand(0, 100);
		$win = 0;
		if ($r <= 20) {
			$win = 1;
		}

		$this->db->update("record", [
				"gift" => 1,
				"win" => $win,
				"#modify_time" => "NOW()"
			], [
				"uid" => $uid
			]
		);

		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		$ack["gift"] = 1;
		$ack["win"] = $win;

		$ack["ret"] = 0;
		return true;
	}



	/**
	 * 获奖情况
	 * @param  array $qry
	 * @param  ref array $ack
	 * @return boolean
	 */
	public function win($qry, &$ack) {
		if (!array_key_exists("uid", $qry)) {
			$ack["ret"] = 1;
			return false;
		}
		$uid = $qry["uid"];

		$results = $this->db->select("record", [
				"win"
			], [
				"uid" => $uid
			]
		);

		if ($this->hasErr()) {
			$ack["ret"] = 2;
			return false;
		}

		$ack["win"] = $results[0]['win'];
		$ack["ret"] = 0;
		return true;
	}
}


?>